/**
 * @file stripe-admin-service.ts
 * @purpose Admin-Funktionen für Stripe (API-Test, Listen, Test-Checkout).
 */

import type { StripeActiveMode } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { createCheckoutIntent } from "@/lib/payments/checkout-intent-service";
import { getActiveProductPrice } from "@/lib/payments/product-catalog-service";

import { createStripeCheckoutSession } from "./stripe-checkout-service";
import { getStripeClient, resetStripeClients } from "./stripe-client";
import { getStripeModeKeyReport } from "./stripe-key-validation";
import { ensureStripeKeyCache } from "./stripe-key-store";
import {
  getStripeAdminStatus,
  recordStripeApiTestResult,
  type StripeAdminStatus,
} from "./stripe-settings-service";
import {
  STRIPE_REQUIRED_WEBHOOK_EVENTS,
  type StripeWebhookEventSpec,
} from "./stripe-webhook-events";

export type StripeWebhookEventEntry = {
  id: string;
  eventId: string;
  eventType: string;
  livemode: boolean;
  processedStatus: string;
  processedAt: string | null;
  errorMessage: string | null;
  createdAt: string;
};

export type StripePaymentEntry = {
  id: string;
  checkoutIntentId: string;
  status: string;
  grossAmount: number;
  currency: string;
  customerName: string | null;
  customerEmail: string | null;
  stripeCheckoutSessionId: string | null;
  stripePaymentIntentId: string | null;
  paidAt: string | null;
  createdAt: string;
};

export type StripeAdminOverview = StripeAdminStatus & {
  recentEvents: StripeWebhookEventEntry[];
  recentPayments: StripePaymentEntry[];
  requiredWebhookEvents: StripeWebhookEventSpec[];
  dashboardLinks: {
    test: string;
    live: string;
    webhooks: string;
    apiKeys: string;
  };
};

export async function getStripeAdminOverview(): Promise<StripeAdminOverview> {
  await ensureStripeKeyCache();

  const [status, events, payments] = await Promise.all([
    getStripeAdminStatus(),
    prisma.stripeWebhookEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.paymentIntent.findMany({
      where: { paymentProvider: "stripe" },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        checkoutIntentId: true,
        status: true,
        grossAmount: true,
        currency: true,
        customerName: true,
        customerEmail: true,
        stripeCheckoutSessionId: true,
        stripePaymentIntentId: true,
        paidAt: true,
        createdAt: true,
      },
    }),
  ]);

  return {
    ...status,
    requiredWebhookEvents: STRIPE_REQUIRED_WEBHOOK_EVENTS,
    dashboardLinks: {
      test: "https://dashboard.stripe.com/test/dashboard",
      live: "https://dashboard.stripe.com/dashboard",
      webhooks:
        status.effectiveMode === "live"
          ? "https://dashboard.stripe.com/webhooks"
          : "https://dashboard.stripe.com/test/webhooks",
      apiKeys:
        status.effectiveMode === "live"
          ? "https://dashboard.stripe.com/apikeys"
          : "https://dashboard.stripe.com/test/apikeys",
    },
    recentEvents: events.map((event) => ({
      id: event.id,
      eventId: event.eventId,
      eventType: event.eventType,
      livemode: event.livemode,
      processedStatus: event.processedStatus,
      processedAt: event.processedAt?.toISOString() ?? null,
      errorMessage: event.errorMessage,
      createdAt: event.createdAt.toISOString(),
    })),
    recentPayments: payments.map((payment) => ({
      id: payment.id,
      checkoutIntentId: payment.checkoutIntentId,
      status: payment.status,
      grossAmount: payment.grossAmount.toNumber(),
      currency: payment.currency,
      customerName: payment.customerName,
      customerEmail: payment.customerEmail,
      stripeCheckoutSessionId: payment.stripeCheckoutSessionId,
      stripePaymentIntentId: payment.stripePaymentIntentId,
      paidAt: payment.paidAt?.toISOString() ?? null,
      createdAt: payment.createdAt.toISOString(),
    })),
  };
}

export async function testStripeApiKeys(
  mode?: StripeActiveMode,
): Promise<{ mode: StripeActiveMode; ok: boolean; message: string }> {
  const activeMode = mode ?? (await getStripeAdminStatus()).effectiveMode;
  const report = getStripeModeKeyReport(activeMode, true);

  if (!report.checkoutAllowed) {
    return {
      mode: activeMode,
      ok: false,
      message:
        report.errors[0] ??
        `Stripe ${activeMode}: Schlüssel-Konfiguration unvollständig oder ungültig.`,
    };
  }

  try {
    resetStripeClients();
    const stripe = getStripeClient(activeMode);
    await stripe.balance.retrieve();
    await recordStripeApiTestResult(activeMode, true);

    return {
      mode: activeMode,
      ok: true,
      message: `Stripe API (${activeMode}) erreichbar.`,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "API-Test fehlgeschlagen.";

    await recordStripeApiTestResult(activeMode, false);
    await prisma.stripeSettings.update({
      where: { id: "default" },
      data: { lastStripeError: message.slice(0, 4000) },
    });

    return {
      mode: activeMode,
      ok: false,
      message,
    };
  }
}

export async function createStripeTestCheckout(input: {
  userId: string;
  productPriceId: string;
}): Promise<{ checkoutId: string; checkoutUrl: string }> {
  const priceResult = await getActiveProductPrice(input.productPriceId);

  if (!priceResult.success || !priceResult.data) {
    throw new Error(
      priceResult.success
        ? "Produktpreis nicht gefunden."
        : priceResult.error.message,
    );
  }

  const checkoutResult = await createCheckoutIntent({
    userId: input.userId,
    productPriceId: input.productPriceId,
    paymentProvider: "stripe",
    note: "Stripe-Admin-Testzahlung",
  });

  if (!checkoutResult.success) {
    throw new Error(checkoutResult.error.message);
  }

  const payment = await prisma.paymentIntent.findFirst({
    where: { checkoutIntentId: checkoutResult.data.id },
    orderBy: { createdAt: "desc" },
  });

  if (!payment) {
    throw new Error("Payment-Intent konnte nicht geladen werden.");
  }

  const session = await createStripeCheckoutSession({
    checkoutIntentId: checkoutResult.data.id,
    paymentIntentId: payment.id,
    userId: input.userId,
  });

  return {
    checkoutId: checkoutResult.data.id,
    checkoutUrl: session.checkoutUrl,
  };
}

export async function findTestProductPrices(): Promise<
  Array<{ id: string; label: string; kind: string; grossAmount: number }>
> {
  const prices = await prisma.productPrice.findMany({
    where: { active: true },
    include: { product: true },
    orderBy: { product: { name: "asc" } },
    take: 50,
  });

  return prices.map((price) => ({
    id: price.id,
    label: `${price.product.name} (${price.billingPeriod})`,
    kind: price.product.kind,
    grossAmount: price.grossAmount.toNumber(),
  }));
}
