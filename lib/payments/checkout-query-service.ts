/**
 * @file checkout-query-service.ts
 * @purpose Checkout-Details für Statusseite und API.
 */

import type { BillingPeriod, PaymentProvider } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import {
  userFailure,
  userSuccess,
  type UserServiceResult,
} from "@/lib/users/user-errors";

import {
  buildBankTransferDisplay,
  type BankTransferDisplay,
} from "./bank-transfer-config";
import { CHECKOUT_INTENT_STATUS_LABELS, PRODUCT_KIND_LABELS } from "./payment-labels";
import type { CheckoutIntentEntry, PaymentIntentEntry } from "./payment-types";
import { toCheckoutIntentEntry, toPaymentIntentEntry } from "./payment-types";
import { isStripeCheckoutEnabled } from "@/lib/stripe/stripe-settings-service";

export type CheckoutDetails = {
  checkout: CheckoutIntentEntry;
  productName: string;
  productSlug: string;
  productKindLabel: string;
  billingPeriod: BillingPeriod;
  statusLabel: string;
  paymentIntent: PaymentIntentEntry | null;
  bankTransfer: BankTransferDisplay | null;
  manualHint: string | null;
  stripeReturnHint: string | null;
  stripeRedirectUrl: string | null;
};

const MANUAL_HINT =
  "Deine Zahlung wird von unserer Buchhaltung manuell geprüft. Du erhältst Zugang, sobald die Zahlung freigegeben wurde.";

const STRIPE_RETURN_HINT =
  "Deine Zahlung bei Stripe wurde abgeschlossen. Die Freischaltung erfolgt automatisch nach Bestätigung durch unser Zahlungssystem — das kann einige Sekunden dauern. Diese Seite zeigt nur den Status an.";

const STRIPE_CANCELLED_HINT =
  "Die Stripe-Zahlung wurde abgebrochen. Du kannst es jederzeit erneut versuchen.";

/**
 * Lädt Checkout-Details für einen eingeloggten Nutzer.
 */
export async function getCheckoutDetailsForUser(
  checkoutId: string,
  userId: string,
  options?: { stripeReturn?: boolean; stripeCancelled?: boolean },
): Promise<UserServiceResult<CheckoutDetails | null>> {
  try {
    const checkout = await prisma.checkoutIntent.findFirst({
      where: { id: checkoutId, userId },
      include: {
        productPrice: {
          include: { product: true },
        },
        paymentIntents: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!checkout) {
      return userSuccess(null);
    }

    const paymentIntent = checkout.paymentIntents[0] ?? null;
    const checkoutEntry = toCheckoutIntentEntry(checkout);

    let bankTransfer: BankTransferDisplay | null = null;

    if (
      checkout.paymentProvider === "bank_transfer" &&
      checkout.status === "awaiting_payment"
    ) {
      try {
        bankTransfer = buildBankTransferDisplay({
          grossAmount: checkout.grossAmount.toNumber(),
          currency: checkout.currency,
          reference:
            paymentIntent?.providerReference ??
            `AW-${checkout.id.slice(0, 8).toUpperCase()}`,
        });
      } catch (error) {
        console.error("[checkout] Bankdaten nicht konfiguriert:", error);
      }
    }

    return userSuccess({
      checkout: checkoutEntry,
      productName: checkout.productPrice.product.name,
      productSlug: checkout.productPrice.product.slug,
      productKindLabel:
        PRODUCT_KIND_LABELS[checkout.productPrice.product.kind],
      billingPeriod: checkout.productPrice.billingPeriod,
      statusLabel: CHECKOUT_INTENT_STATUS_LABELS[checkout.status],
      paymentIntent: paymentIntent
        ? toPaymentIntentEntry(paymentIntent)
        : null,
      bankTransfer,
      manualHint:
        checkout.paymentProvider === "manual" &&
        checkout.status === "awaiting_payment"
          ? MANUAL_HINT
          : null,
      stripeReturnHint: options?.stripeReturn
        ? STRIPE_RETURN_HINT
        : options?.stripeCancelled
          ? STRIPE_CANCELLED_HINT
          : null,
      stripeRedirectUrl:
        checkout.paymentProvider === "stripe" &&
        checkout.status === "awaiting_payment" &&
        paymentIntent?.providerMetadata &&
        typeof paymentIntent.providerMetadata === "object" &&
        paymentIntent.providerMetadata !== null &&
        "checkoutUrl" in paymentIntent.providerMetadata &&
        typeof (paymentIntent.providerMetadata as { checkoutUrl?: unknown })
          .checkoutUrl === "string"
          ? (paymentIntent.providerMetadata as { checkoutUrl: string })
              .checkoutUrl
          : null,
    });
  } catch {
    return userFailure({
      code: "INTERNAL_ERROR",
      message: "Checkout konnte nicht geladen werden.",
    });
  }
}

export async function getCheckoutUiProviders(): Promise<PaymentProvider[]> {
  const providers: PaymentProvider[] = ["bank_transfer", "manual"];

  if (await isStripeCheckoutEnabled()) {
    providers.unshift("stripe");
  }

  return providers;
}

/** @deprecated Nutze getCheckoutUiProviders() für dynamische Stripe-Verfügbarkeit */
export const CHECKOUT_UI_PROVIDERS: PaymentProvider[] = [
  "bank_transfer",
  "manual",
];
