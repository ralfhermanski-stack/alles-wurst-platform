/**
 * @file stripe-checkout-service.ts
 * @purpose Stripe Checkout Session serverseitig erstellen.
 */

import type { BillingPeriod, StripeActiveMode } from "@prisma/client";
import type Stripe from "stripe";

import { prisma } from "@/lib/db/prisma";

import { getStripeClient } from "./stripe-client";
import { getAppBaseUrl } from "./stripe-config";
import {
  buildClientReferenceId,
  buildStripeMetadata,
  resolveStripeProductType,
} from "./stripe-metadata";
import { getActiveStripeMode } from "./stripe-settings-service";
import { ensureStripeKeyCache } from "./stripe-key-store";

export type StripeCheckoutSessionResult = {
  sessionId: string;
  checkoutUrl: string;
  mode: StripeActiveMode;
};

function billingPeriodToStripeInterval(
  period: BillingPeriod,
): Stripe.PriceCreateParams.Recurring.Interval | null {
  switch (period) {
    case "monthly":
      return "month";
    case "yearly":
      return "year";
    case "one_time":
      return null;
    default: {
      const exhaustive: never = period;
      return exhaustive;
    }
  }
}

function formatUserName(
  profile: {
    firstName: string | null;
    lastName: string | null;
  } | null,
  email: string,
): string {
  const parts = [profile?.firstName, profile?.lastName].filter(Boolean);

  if (parts.length > 0) {
    return parts.join(" ");
  }

  return email;
}

async function resolveStripeCustomerId(input: {
  userId: string;
  mode: StripeActiveMode;
  email: string;
  name: string;
}): Promise<string | undefined> {
  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: {
      stripeCustomerIdTest: true,
      stripeCustomerIdLive: true,
    },
  });

  if (!user) {
    return undefined;
  }

  const existing =
    input.mode === "live"
      ? user.stripeCustomerIdLive
      : user.stripeCustomerIdTest;

  if (existing) {
    return existing;
  }

  const stripe = getStripeClient(input.mode);
  const customer = await stripe.customers.create({
    email: input.email,
    name: input.name,
    metadata: {
      user_id: input.userId,
      source: "alles-wurst",
      environment: input.mode,
    },
  });

  await prisma.user.update({
    where: { id: input.userId },
    data:
      input.mode === "live"
        ? { stripeCustomerIdLive: customer.id }
        : { stripeCustomerIdTest: customer.id },
  });

  return customer.id;
}

/**
 * Erstellt eine Stripe Checkout Session für einen bestehenden Checkout-Intent.
 * Preis und Produkt werden ausschließlich aus der Datenbank geladen.
 */
export async function createStripeCheckoutSession(input: {
  checkoutIntentId: string;
  paymentIntentId: string;
  userId: string;
}): Promise<StripeCheckoutSessionResult> {
  await ensureStripeKeyCache();
  const mode = await getActiveStripeMode();

  const checkout = await prisma.checkoutIntent.findFirst({
    where: { id: input.checkoutIntentId, userId: input.userId },
    include: {
      productPrice: {
        include: {
          product: {
            include: { course: { select: { id: true } } },
          },
        },
      },
      purchaseLegalRecord: true,
      user: {
        include: {
          profile: true,
          membership: { select: { id: true } },
        },
      },
    },
  });

  if (!checkout) {
    throw new Error("Checkout-Intent wurde nicht gefunden.");
  }

  if (checkout.paymentProvider !== "stripe") {
    throw new Error("Checkout ist nicht für Stripe vorgesehen.");
  }

  if (checkout.status === "succeeded" || checkout.status === "cancelled") {
    throw new Error("Checkout ist bereits abgeschlossen.");
  }

  const product = checkout.productPrice.product;
  const grossAmount = checkout.grossAmount.toNumber();
  const currency = checkout.currency.toLowerCase();
  const userEmail = checkout.user.email;
  const userName = formatUserName(checkout.user.profile, userEmail);
  const productType = resolveStripeProductType(product.kind);
  const billingReference =
    checkout.accountingPositionId ?? checkout.id;
  const courseId = product.course?.id ?? "";
  const membershipId = checkout.user.membership?.id ?? "";
  const interval = billingPeriodToStripeInterval(
    checkout.productPrice.billingPeriod,
  );
  const isSubscription = interval !== null && productType === "membership";

  const stripe = getStripeClient(mode);
  const customerId = await resolveStripeCustomerId({
    userId: input.userId,
    mode,
    email: userEmail,
    name: userName,
  });

  const unitAmount = Math.round(grossAmount * 100);
  const baseUrl = getAppBaseUrl();
  const successUrl = `${baseUrl}/kaufen/status/${checkout.id}?stripe=return`;
  const cancelUrl = `${baseUrl}/kaufen/status/${checkout.id}?stripe=cancelled`;

  const metadata = buildStripeMetadata({
    user_id: input.userId,
    user_email: userEmail,
    user_name: userName,
    course_id: courseId,
    membership_id: membershipId,
    order_id: checkout.id,
    internal_booking_id: checkout.accountingPositionId ?? "",
    product_type: productType,
    product_name: product.name,
    amount: grossAmount.toFixed(2),
    currency: checkout.currency,
    billing_reference: billingReference,
    environment: mode,
    product_id: product.id,
    product_price_id: checkout.productPriceId,
    payment_intent_id: input.paymentIntentId,
    access_mode: checkout.purchaseLegalRecord?.accessMode ?? undefined,
    immediate_access: checkout.purchaseLegalRecord?.immediateAccessConsented
      ? "true"
      : "false",
    withdrawal_loss_ack: checkout.purchaseLegalRecord?.withdrawalLossAcknowledged
      ? "true"
      : "false",
    consent_version: checkout.purchaseLegalRecord?.consentTextVersion ?? undefined,
    terms_checksum: checkout.purchaseLegalRecord?.termsChecksum ?? undefined,
  });

  const lineItem: Stripe.Checkout.SessionCreateParams.LineItem = isSubscription
    ? {
        quantity: 1,
        price_data: {
          currency,
          unit_amount: unitAmount,
          product_data: {
            name: product.name,
            metadata: {
              product_id: product.id,
              product_type: productType,
            },
          },
          recurring: { interval },
        },
      }
    : {
        quantity: 1,
        price_data: {
          currency,
          unit_amount: unitAmount,
          product_data: {
            name: product.name,
            metadata: {
              product_id: product.id,
              product_type: productType,
            },
          },
        },
      };

  const session = await stripe.checkout.sessions.create({
    mode: isSubscription ? "subscription" : "payment",
    customer: customerId,
    customer_email: customerId ? undefined : userEmail,
    client_reference_id: buildClientReferenceId(checkout.id),
    line_items: [lineItem],
    success_url: successUrl,
    cancel_url: cancelUrl,
    billing_address_collection: "required",
    phone_number_collection: { enabled: false },
    automatic_tax: { enabled: false },
    metadata,
    payment_intent_data: isSubscription
      ? undefined
      : {
          metadata,
        },
    subscription_data: isSubscription
      ? { metadata }
      : undefined,
  });

  if (!session.url) {
    throw new Error("Stripe Checkout URL konnte nicht erstellt werden.");
  }

  await prisma.$transaction([
    prisma.paymentIntent.update({
      where: { id: input.paymentIntentId },
      data: {
        stripeCheckoutSessionId: session.id,
        stripeCustomerId: customerId ?? session.customer?.toString() ?? null,
        customerEmail: userEmail,
        customerName: userName,
        providerReference: session.id,
        status: "awaiting_payment",
        providerMetadata: {
          stripeSessionId: session.id,
          stripeMode: mode,
          checkoutUrl: session.url,
        },
      },
    }),
    prisma.checkoutIntent.update({
      where: { id: checkout.id },
      data: {
        status: "awaiting_payment",
        providerMetadata: {
          stripeSessionId: session.id,
          stripeMode: mode,
        },
      },
    }),
  ]);

  return {
    sessionId: session.id,
    checkoutUrl: session.url,
    mode,
  };
}
