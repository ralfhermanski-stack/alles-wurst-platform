/**
 * @file stripe-fulfillment.ts
 * @purpose Freischaltung nach bestätigter Stripe-Zahlung (nur via Webhook).
 */

import type { StripeActiveMode } from "@prisma/client";
import { Prisma } from "@prisma/client";
import type Stripe from "stripe";

import { createAccountingAuditLog } from "@/lib/accounting/accounting-audit";
import type { AccountingActor } from "@/lib/accounting/accounting-types";
import { prisma } from "@/lib/db/prisma";
import { createInvoiceFromPosition } from "@/lib/invoices/invoice-service";
import { fulfillSuccessfulPayment } from "@/lib/payments/payment-fulfillment-service";
import { paymentIntentStatusToAccountingStatus } from "@/lib/payments/payment-status-mapper";

import { sendStripePurchaseConfirmationMail } from "./stripe-mail";
import { parseStripeMetadata } from "./stripe-metadata";
import { recordStripeError } from "./stripe-settings-service";

export type StripePaymentSnapshot = {
  stripeCustomerId: string | null;
  stripeCheckoutSessionId: string | null;
  stripePaymentIntentId: string | null;
  stripeChargeId: string | null;
  stripeSubscriptionId: string | null;
  stripeInvoiceId: string | null;
  customerName: string | null;
  customerEmail: string | null;
  billingAddressJson: Record<string, unknown> | null;
  paymentMethodType: string | null;
  amountTotal: number | null;
  currency: string | null;
  paidAt: Date;
};

async function getSystemAccountingActor(): Promise<AccountingActor | null> {
  const admin = await prisma.user.findFirst({
    where: {
      deletedAt: null,
      systemRole: "ADMIN",
      membership: { role: { in: ["admin", "accounting"] } },
    },
    include: { profile: true, membership: true },
  });

  if (admin?.membership) {
    return {
      userId: admin.id,
      email: admin.email,
      displayName:
        [admin.profile?.firstName, admin.profile?.lastName]
          .filter(Boolean)
          .join(" ") || admin.email,
      role: admin.membership.role as AccountingActor["role"],
    };
  }

  const fallbackAdmin = await prisma.user.findFirst({
    where: { deletedAt: null, systemRole: "ADMIN" },
    include: { profile: true, membership: true },
  });

  if (!fallbackAdmin) {
    return null;
  }

  return {
    userId: fallbackAdmin.id,
    email: fallbackAdmin.email,
    displayName:
      [fallbackAdmin.profile?.firstName, fallbackAdmin.profile?.lastName]
        .filter(Boolean)
        .join(" ") || fallbackAdmin.email,
    role: "admin",
  };
}

function extractBillingAddress(
  session: Stripe.Checkout.Session,
): Record<string, unknown> | null {
  const details = session.customer_details;

  if (!details?.address) {
    return null;
  }

  return {
    name: details.name ?? null,
    email: details.email ?? null,
    phone: details.phone ?? null,
    address: details.address,
    tax_ids: details.tax_ids ?? [],
  };
}

export function buildPaymentSnapshotFromSession(
  session: Stripe.Checkout.Session,
): StripePaymentSnapshot {
  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id ?? null;

  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id ?? null;

  return {
    stripeCustomerId:
      typeof session.customer === "string"
        ? session.customer
        : session.customer?.id ?? null,
    stripeCheckoutSessionId: session.id,
    stripePaymentIntentId: paymentIntentId,
    stripeChargeId: null,
    stripeSubscriptionId: subscriptionId,
    stripeInvoiceId: null,
    customerName: session.customer_details?.name ?? null,
    customerEmail: session.customer_details?.email ?? session.customer_email ?? null,
    billingAddressJson: extractBillingAddress(session),
    paymentMethodType: session.payment_method_types?.[0] ?? null,
    amountTotal:
      session.amount_total !== null ? session.amount_total / 100 : null,
    currency: session.currency?.toUpperCase() ?? null,
    paidAt: new Date(),
  };
}

export function buildPaymentSnapshotFromPaymentIntent(
  paymentIntent: Stripe.PaymentIntent,
): StripePaymentSnapshot {
  const chargeId =
    typeof paymentIntent.latest_charge === "string"
      ? paymentIntent.latest_charge
      : paymentIntent.latest_charge?.id ?? null;

  return {
    stripeCustomerId:
      typeof paymentIntent.customer === "string"
        ? paymentIntent.customer
        : paymentIntent.customer?.id ?? null,
    stripeCheckoutSessionId: null,
    stripePaymentIntentId: paymentIntent.id,
    stripeChargeId: chargeId,
    stripeSubscriptionId: null,
    stripeInvoiceId: null,
    customerName: null,
    customerEmail: paymentIntent.receipt_email ?? null,
    billingAddressJson: null,
    paymentMethodType: paymentIntent.payment_method_types?.[0] ?? null,
    amountTotal: paymentIntent.amount_received / 100,
    currency: paymentIntent.currency.toUpperCase(),
    paidAt: new Date(),
  };
}

async function persistStripeCustomerId(
  userId: string,
  mode: StripeActiveMode,
  stripeCustomerId: string | null,
): Promise<void> {
  if (!stripeCustomerId) {
    return;
  }

  await prisma.user.update({
    where: { id: userId },
    data:
      mode === "live"
        ? { stripeCustomerIdLive: stripeCustomerId }
        : { stripeCustomerIdTest: stripeCustomerId },
  });
}

/**
 * Verarbeitet eine bestätigte Zahlung idempotent (nur Webhook).
 */
export async function processStripePaymentSuccess(input: {
  checkoutIntentId: string;
  paymentIntentId: string;
  webhookEventId: string;
  mode: StripeActiveMode;
  snapshot: StripePaymentSnapshot;
  metadata?: Record<string, string>;
}): Promise<{ fulfilled: boolean; alreadyProcessed: boolean }> {
  const checkout = await prisma.checkoutIntent.findUnique({
    where: { id: input.checkoutIntentId },
    include: {
      productPrice: { include: { product: true } },
      paymentIntents: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  if (!checkout) {
    throw new Error(`Checkout ${input.checkoutIntentId} nicht gefunden.`);
  }

  if (checkout.status === "succeeded") {
    return { fulfilled: false, alreadyProcessed: true };
  }

  const payment =
    checkout.paymentIntents[0]?.id === input.paymentIntentId
      ? checkout.paymentIntents[0]
      : await prisma.paymentIntent.findUnique({
          where: { id: input.paymentIntentId },
        });

  if (!payment) {
    throw new Error(`Payment-Intent ${input.paymentIntentId} nicht gefunden.`);
  }

  const paidAt = input.snapshot.paidAt;

  await prisma.$transaction(async (tx) => {
    await tx.paymentIntent.update({
      where: { id: payment.id },
      data: {
        status: "succeeded",
        paidAt,
        processedAt: new Date(),
        webhookEventId: input.webhookEventId,
        stripeCustomerId: input.snapshot.stripeCustomerId,
        stripeCheckoutSessionId: input.snapshot.stripeCheckoutSessionId,
        stripePaymentIntentId: input.snapshot.stripePaymentIntentId,
        stripeChargeId: input.snapshot.stripeChargeId,
        stripeSubscriptionId: input.snapshot.stripeSubscriptionId,
        stripeInvoiceId: input.snapshot.stripeInvoiceId,
        customerName: input.snapshot.customerName,
        customerEmail: input.snapshot.customerEmail,
        billingAddressJson:
          (input.snapshot.billingAddressJson as Prisma.InputJsonValue) ??
          undefined,
        paymentMethodType: input.snapshot.paymentMethodType,
        providerReference:
          input.snapshot.stripePaymentIntentId ??
          input.snapshot.stripeCheckoutSessionId ??
          payment.providerReference,
      },
    });

    await tx.checkoutIntent.update({
      where: { id: checkout.id },
      data: {
        status: "succeeded",
        completedAt: paidAt,
      },
    });

    if (checkout.accountingPositionId) {
      await tx.accountingPosition.update({
        where: { id: checkout.accountingPositionId },
        data: {
          paymentStatus: "paid",
          paidAt,
        },
      });
    }
  });

  await persistStripeCustomerId(
    checkout.userId,
    input.mode,
    input.snapshot.stripeCustomerId,
  );

  const fulfillment = await fulfillSuccessfulPayment({
    userId: checkout.userId,
    checkoutIntentId: checkout.id,
    accountingPositionId: checkout.accountingPositionId,
  });

  if (!fulfillment.success) {
    const message = `Freischaltung fehlgeschlagen (Checkout ${checkout.id}): ${fulfillment.error.message}`;
    console.error("[stripe/fulfillment]", message);
    await recordStripeError(message);
    throw new Error(message);
  }

  const actor = await getSystemAccountingActor();

  if (checkout.accountingPositionId && actor) {
    const invoiceResult = await createInvoiceFromPosition(
      actor,
      checkout.userId,
      checkout.accountingPositionId,
    );

    if (!invoiceResult.success) {
      await createAccountingAuditLog({
        targetUserId: checkout.userId,
        actorUserId: actor.userId,
        actorRole: actor.role,
        action: "manual_update",
        summary: "Stripe-Zahlung: Rechnung konnte nicht automatisch erzeugt werden.",
        note: invoiceResult.error.message,
        newValues: {
          checkoutIntentId: checkout.id,
          stripeEventId: input.webhookEventId,
          billingAddress: input.snapshot.billingAddressJson,
        },
      });
    }
  }

  const meta = parseStripeMetadata(input.metadata);
  const productName =
    meta.product_name ?? checkout.productPrice.product.name;

  await sendStripePurchaseConfirmationMail({
    userId: checkout.userId,
    email: input.snapshot.customerEmail ?? meta.user_email ?? "",
    productName,
    amount: input.snapshot.amountTotal ?? checkout.grossAmount.toNumber(),
    currency: input.snapshot.currency ?? checkout.currency,
    checkoutIntentId: checkout.id,
  });

  if (actor) {
    await createAccountingAuditLog({
      targetUserId: checkout.userId,
      actorUserId: actor.userId,
      actorRole: actor.role,
      action: "payment_fulfillment",
      summary: `Stripe-Zahlung bestätigt: ${productName}`,
      newValues: {
        checkoutIntentId: checkout.id,
        webhookEventId: input.webhookEventId,
        stripePaymentIntentId: input.snapshot.stripePaymentIntentId,
        fulfillment: fulfillment.data,
      },
    });
  }

  return { fulfilled: true, alreadyProcessed: false };
}

/**
 * Markiert Zahlung/Checkout als fehlgeschlagen.
 */
export async function processStripePaymentFailure(input: {
  checkoutIntentId: string;
  paymentIntentId: string;
  webhookEventId: string;
  errorMessage: string;
}): Promise<void> {
  const checkout = await prisma.checkoutIntent.findUnique({
    where: { id: input.checkoutIntentId },
  });

  if (!checkout || checkout.status === "succeeded") {
    return;
  }

  await prisma.$transaction(async (tx) => {
    await tx.paymentIntent.updateMany({
      where: { id: input.paymentIntentId },
      data: {
        status: "failed",
        failedAt: new Date(),
        webhookEventId: input.webhookEventId,
        errorMessage: input.errorMessage.slice(0, 4000),
        processedAt: new Date(),
      },
    });

    await tx.checkoutIntent.update({
      where: { id: checkout.id },
      data: { status: "failed" },
    });

    if (checkout.accountingPositionId) {
      await tx.accountingPosition.update({
        where: { id: checkout.accountingPositionId },
        data: {
          paymentStatus: paymentIntentStatusToAccountingStatus("failed"),
        },
      });
    }
  });

  const actor = await getSystemAccountingActor();

  if (actor) {
    await createAccountingAuditLog({
      targetUserId: checkout.userId,
      actorUserId: actor.userId,
      actorRole: actor.role,
      action: "position_status_change",
      summary: "Stripe-Zahlung fehlgeschlagen.",
      note: input.errorMessage,
      newValues: {
        checkoutIntentId: checkout.id,
        webhookEventId: input.webhookEventId,
      },
    });
  }
}

/**
 * Rückerstattung: Buchhaltung aktualisieren, Admin-Prüfung — kein automatischer Zugriffsentzug.
 */
export async function processStripeRefund(input: {
  chargeId: string;
  paymentIntentId?: string | null;
  webhookEventId: string;
  metadata?: Record<string, string>;
}): Promise<void> {
  const payment = await prisma.paymentIntent.findFirst({
    where: {
      OR: [
        { stripeChargeId: input.chargeId },
        ...(input.paymentIntentId
          ? [{ stripePaymentIntentId: input.paymentIntentId }]
          : []),
      ],
    },
    include: { checkoutIntent: true },
  });

  if (!payment?.checkoutIntent) {
    return;
  }

  const checkout = payment.checkoutIntent;

  await prisma.$transaction(async (tx) => {
    await tx.paymentIntent.update({
      where: { id: payment.id },
      data: {
        webhookEventId: input.webhookEventId,
        processedAt: new Date(),
        errorMessage: "Rückerstattung — Admin-Prüfung erforderlich.",
      },
    });

    if (checkout.accountingPositionId) {
      await tx.accountingPosition.update({
        where: { id: checkout.accountingPositionId },
        data: {
          paymentStatus: "refunded",
          note: "Stripe-Rückerstattung — bitte Zugriff manuell prüfen.",
        },
      });
    }
  });

  const actor = await getSystemAccountingActor();

  if (actor) {
    await createAccountingAuditLog({
      targetUserId: checkout.userId,
      actorUserId: actor.userId,
      actorRole: actor.role,
      action: "position_status_change",
      summary: "Stripe-Rückerstattung erhalten — Admin-Prüfung erforderlich.",
      note: "Kurszugriff/Mitgliedschaft wurde nicht automatisch entzogen.",
      newValues: {
        chargeId: input.chargeId,
        checkoutIntentId: checkout.id,
        webhookEventId: input.webhookEventId,
        requiresAdminReview: true,
      },
    });
  }
}
