/**
 * @file stripe-webhook-service.ts
 * @purpose Stripe-Webhook-Verarbeitung mit Signaturprüfung und Idempotenz.
 */

import Stripe from "stripe";

import type { StripeActiveMode, StripeWebhookProcessedStatus } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

import { getStripeClient } from "./stripe-client";
import {
  getStripeWebhookSecret,
  resolveStripeModeFromLivemode,
} from "./stripe-config";
import {
  buildPaymentSnapshotFromPaymentIntent,
  buildPaymentSnapshotFromSession,
  processStripePaymentFailure,
  processStripePaymentSuccess,
  processStripeRefund,
} from "./stripe-fulfillment";
import { syncMembershipFromStripeSubscription } from "@/lib/membership/membership-stripe-subscription-service";
import { parseStripeMetadata } from "./stripe-metadata";
import {
  recordStripeError,
  recordStripeWebhookReceived,
} from "./stripe-settings-service";
import { STRIPE_REQUIRED_WEBHOOK_EVENT_TYPES } from "./stripe-webhook-events";

const HANDLED_EVENTS = new Set(STRIPE_REQUIRED_WEBHOOK_EVENT_TYPES);

export type StripeWebhookResult = {
  received: boolean;
  eventId: string;
  eventType: string;
  status: StripeWebhookProcessedStatus;
  duplicate: boolean;
};

function resolveWebhookMode(livemode: boolean): StripeActiveMode {
  return resolveStripeModeFromLivemode(livemode);
}

async function storeWebhookEvent(input: {
  event: Stripe.Event;
  status: StripeWebhookProcessedStatus;
  errorMessage?: string;
}): Promise<{ duplicate: boolean; recordId: string }> {
  const existing = await prisma.stripeWebhookEvent.findUnique({
    where: { eventId: input.event.id },
  });

  if (existing) {
    return { duplicate: true, recordId: existing.id };
  }

  const record = await prisma.stripeWebhookEvent.create({
    data: {
      eventId: input.event.id,
      eventType: input.event.type,
      livemode: input.event.livemode,
      payloadJson: input.event as object,
      processedStatus: input.status,
      processedAt: input.status === "pending" ? null : new Date(),
      errorMessage: input.errorMessage,
    },
  });

  return { duplicate: false, recordId: record.id };
}

async function markWebhookEvent(
  recordId: string,
  status: StripeWebhookProcessedStatus,
  errorMessage?: string,
): Promise<void> {
  await prisma.stripeWebhookEvent.update({
    where: { id: recordId },
    data: {
      processedStatus: status,
      processedAt: new Date(),
      errorMessage: errorMessage?.slice(0, 4000),
    },
  });
}

async function resolveCheckoutFromSession(
  session: Stripe.Checkout.Session,
): Promise<{
  checkoutIntentId: string;
  paymentIntentId: string;
} | null> {
  const meta = parseStripeMetadata(session.metadata ?? undefined);

  if (meta.order_id && meta.payment_intent_id) {
    return {
      checkoutIntentId: meta.order_id,
      paymentIntentId: meta.payment_intent_id,
    };
  }

  const payment = await prisma.paymentIntent.findFirst({
    where: { stripeCheckoutSessionId: session.id },
    select: { id: true, checkoutIntentId: true },
  });

  if (payment) {
    return {
      checkoutIntentId: payment.checkoutIntentId,
      paymentIntentId: payment.id,
    };
  }

  return null;
}

async function handleCheckoutSessionSuccess(
  session: Stripe.Checkout.Session,
  event: Stripe.Event,
): Promise<void> {
  const refs = await resolveCheckoutFromSession(session);

  if (!refs) {
    throw new Error(`Kein Checkout für Session ${session.id} gefunden.`);
  }

  if (
    session.payment_status !== "paid" &&
    session.payment_status !== "no_payment_required"
  ) {
    return;
  }

  const mode = resolveWebhookMode(event.livemode);
  const snapshot = buildPaymentSnapshotFromSession(session);

  if (snapshot.stripePaymentIntentId && !snapshot.stripeChargeId) {
    try {
      const stripe = getStripeClient(mode);
      const pi = await stripe.paymentIntents.retrieve(
        snapshot.stripePaymentIntentId,
        { expand: ["latest_charge"] },
      );

      const chargeId =
        typeof pi.latest_charge === "string"
          ? pi.latest_charge
          : pi.latest_charge?.id ?? null;

      snapshot.stripeChargeId = chargeId;
    } catch {
      // Charge-ID optional — Fulfillment trotzdem fortsetzen
    }
  }

  await processStripePaymentSuccess({
    checkoutIntentId: refs.checkoutIntentId,
    paymentIntentId: refs.paymentIntentId,
    webhookEventId: event.id,
    mode,
    snapshot,
    metadata: session.metadata ?? undefined,
  });
}

async function handleCheckoutSessionFailed(
  session: Stripe.Checkout.Session,
  event: Stripe.Event,
): Promise<void> {
  const refs = await resolveCheckoutFromSession(session);

  if (!refs) {
    return;
  }

  await processStripePaymentFailure({
    checkoutIntentId: refs.checkoutIntentId,
    paymentIntentId: refs.paymentIntentId,
    webhookEventId: event.id,
    errorMessage: `Async-Zahlung fehlgeschlagen (Session ${session.id}).`,
  });
}

async function handlePaymentIntentSucceeded(
  paymentIntent: Stripe.PaymentIntent,
  event: Stripe.Event,
): Promise<void> {
  const meta = parseStripeMetadata(paymentIntent.metadata ?? undefined);

  let checkoutIntentId = meta.order_id;
  let paymentIntentId = meta.payment_intent_id;

  if (!checkoutIntentId || !paymentIntentId) {
    const payment = await prisma.paymentIntent.findFirst({
      where: { stripePaymentIntentId: paymentIntent.id },
      select: { id: true, checkoutIntentId: true },
    });

    if (!payment) {
      return;
    }

    checkoutIntentId = payment.checkoutIntentId;
    paymentIntentId = payment.id;
  }

  const checkout = await prisma.checkoutIntent.findUnique({
    where: { id: checkoutIntentId },
    select: { status: true },
  });

  if (checkout?.status === "succeeded") {
    return;
  }

  const mode = resolveWebhookMode(event.livemode);
  const snapshot = buildPaymentSnapshotFromPaymentIntent(paymentIntent);

  await processStripePaymentSuccess({
    checkoutIntentId,
    paymentIntentId,
    webhookEventId: event.id,
    mode,
    snapshot,
    metadata: paymentIntent.metadata ?? undefined,
  });
}

async function handlePaymentIntentFailed(
  paymentIntent: Stripe.PaymentIntent,
  event: Stripe.Event,
): Promise<void> {
  const meta = parseStripeMetadata(paymentIntent.metadata ?? undefined);

  const payment = await prisma.paymentIntent.findFirst({
    where: {
      OR: [
        { stripePaymentIntentId: paymentIntent.id },
        { id: meta.payment_intent_id ?? "" },
      ],
    },
    select: { id: true, checkoutIntentId: true },
  });

  if (!payment) {
    return;
  }

  await processStripePaymentFailure({
    checkoutIntentId: payment.checkoutIntentId,
    paymentIntentId: payment.id,
    webhookEventId: event.id,
    errorMessage:
      paymentIntent.last_payment_error?.message ??
      "Zahlung fehlgeschlagen.",
  });
}

async function handleSubscriptionEvent(
  subscription: Stripe.Subscription,
  event: Stripe.Event,
): Promise<void> {
  await syncMembershipFromStripeSubscription(subscription);

  const meta = parseStripeMetadata(subscription.metadata ?? undefined);
  const paymentIntentId = meta.payment_intent_id;
  const checkoutIntentId = meta.order_id;

  if (!paymentIntentId) {
    return;
  }

  await prisma.paymentIntent.updateMany({
    where: { id: paymentIntentId },
    data: {
      stripeSubscriptionId: subscription.id,
      webhookEventId: event.id,
      processedAt: new Date(),
    },
  });

  if (!checkoutIntentId) {
    return;
  }

  const checkout = await prisma.checkoutIntent.findUnique({
    where: { id: checkoutIntentId },
    select: { status: true },
  });

  if (checkout?.status !== "awaiting_payment") {
    return;
  }

  const payment = await prisma.paymentIntent.findUnique({
    where: { id: paymentIntentId },
    select: { stripeCheckoutSessionId: true },
  });

  if (!payment?.stripeCheckoutSessionId) {
    return;
  }

  const mode = resolveWebhookMode(event.livemode);
  const stripe = getStripeClient(mode);
  const session = await stripe.checkout.sessions.retrieve(
    payment.stripeCheckoutSessionId,
  );

  if (
    session.payment_status !== "paid" &&
    session.payment_status !== "no_payment_required"
  ) {
    return;
  }

  const snapshot = buildPaymentSnapshotFromSession(session);

  await processStripePaymentSuccess({
    checkoutIntentId,
    paymentIntentId,
    webhookEventId: event.id,
    mode,
    snapshot,
    metadata: session.metadata ?? subscription.metadata ?? undefined,
  });
}

async function handleInvoicePaid(
  invoice: Stripe.Invoice,
  event: Stripe.Event,
): Promise<void> {
  const subscriptionId =
    typeof invoice.subscription === "string"
      ? invoice.subscription
      : invoice.subscription?.id ?? null;

  if (!subscriptionId) {
    return;
  }

  const payment = await prisma.paymentIntent.findFirst({
    where: { stripeSubscriptionId: subscriptionId },
    include: { checkoutIntent: { include: { productPrice: true } } },
  });

  if (!payment?.checkoutIntent) {
    return;
  }

  await prisma.paymentIntent.update({
    where: { id: payment.id },
    data: {
      stripeInvoiceId: invoice.id,
      webhookEventId: event.id,
    },
  });

  if (payment.checkoutIntent.status !== "succeeded") {
    return;
  }

  const period = payment.checkoutIntent.productPrice?.billingPeriod;

  if (period === "monthly" || period === "yearly") {
    const endsAt = new Date();

    if (period === "monthly") {
      endsAt.setMonth(endsAt.getMonth() + 1);
    } else {
      endsAt.setFullYear(endsAt.getFullYear() + 1);
    }

    await prisma.membership.updateMany({
      where: { userId: payment.checkoutIntent.userId },
      data: {
        status: "active",
        paymentStatus: "paid",
        endsAt,
        extendedUntil: endsAt,
        lastRenewalReminderForPeriodEnd: null,
      },
    });
  }
}

async function dispatchEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded": {
      const session = event.data.object as Stripe.Checkout.Session;
      await handleCheckoutSessionSuccess(session, event);
      break;
    }
    case "checkout.session.async_payment_failed": {
      const session = event.data.object as Stripe.Checkout.Session;
      await handleCheckoutSessionFailed(session, event);
      break;
    }
    case "payment_intent.succeeded": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      await handlePaymentIntentSucceeded(paymentIntent, event);
      break;
    }
    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      await handlePaymentIntentFailed(paymentIntent, event);
      break;
    }
    case "charge.refunded": {
      const charge = event.data.object as Stripe.Charge;
      const paymentIntentId =
        typeof charge.payment_intent === "string"
          ? charge.payment_intent
          : charge.payment_intent?.id ?? null;

      await processStripeRefund({
        chargeId: charge.id,
        paymentIntentId,
        webhookEventId: event.id,
        metadata: charge.metadata ?? undefined,
      });
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionEvent(subscription, event);
      break;
    }
    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice;
      await handleInvoicePaid(invoice, event);
      break;
    }
    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      await recordStripeError(
        `Rechnungszahlung fehlgeschlagen: ${invoice.id}`,
      );
      break;
    }
    default:
      break;
  }
}

function peekWebhookLivemode(rawBody: string): boolean | null {
  try {
    const parsed = JSON.parse(rawBody) as { livemode?: boolean };

    return typeof parsed.livemode === "boolean" ? parsed.livemode : null;
  } catch {
    return null;
  }
}

function verifyWebhookEvent(
  rawBody: string,
  signature: string,
  mode: StripeActiveMode,
): Stripe.Event | null {
  const secret = getStripeWebhookSecret(mode);

  if (!secret) {
    return null;
  }

  try {
    return Stripe.webhooks.constructEvent(rawBody, signature, secret);
  } catch {
    return null;
  }
}

/**
 * Verifiziert und verarbeitet einen Stripe-Webhook.
 * Webhook Secrets sind getrennt von API-Keys — constructEvent nutzt keinen Server-Key.
 */
export async function processStripeWebhook(
  rawBody: string,
  signature: string | null,
): Promise<StripeWebhookResult> {
  if (!signature) {
    throw new Error("Stripe-Signatur-Header fehlt.");
  }

  const hintedLivemode = peekWebhookLivemode(rawBody);
  const primaryMode =
    hintedLivemode === null
      ? null
      : resolveStripeModeFromLivemode(hintedLivemode);
  const modes: StripeActiveMode[] = primaryMode
    ? [primaryMode, primaryMode === "test" ? "live" : "test"]
    : ["test", "live"];

  let event: Stripe.Event | null = null;

  for (const mode of modes) {
    event = verifyWebhookEvent(rawBody, signature, mode);

    if (event) {
      break;
    }
  }

  if (!event) {
    throw new Error("Ungültige Stripe-Signatur.");
  }

  if (!HANDLED_EVENTS.has(event.type)) {
    const { duplicate, recordId } = await storeWebhookEvent({
      event,
      status: "ignored",
    });

    if (!duplicate) {
      await recordStripeWebhookReceived(event.id);
    } else {
      await markWebhookEvent(recordId, "ignored");
    }

    return {
      received: true,
      eventId: event.id,
      eventType: event.type,
      status: "ignored",
      duplicate,
    };
  }

  const { duplicate, recordId } = await storeWebhookEvent({
    event,
    status: "pending",
  });

  if (duplicate) {
    const existing = await prisma.stripeWebhookEvent.findUnique({
      where: { eventId: event.id },
    });

    if (existing?.processedStatus !== "failed") {
      return {
        received: true,
        eventId: event.id,
        eventType: event.type,
        status: existing?.processedStatus ?? "ignored",
        duplicate: true,
      };
    }

    try {
      await dispatchEvent(event);
      await markWebhookEvent(existing.id, "processed");
      await recordStripeWebhookReceived(event.id);

      return {
        received: true,
        eventId: event.id,
        eventType: event.type,
        status: "processed",
        duplicate: true,
      };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Webhook-Verarbeitung fehlgeschlagen.";

      await markWebhookEvent(existing.id, "failed", message);
      await recordStripeError(message);

      throw error;
    }
  }

  try {
    await dispatchEvent(event);
    await markWebhookEvent(recordId, "processed");
    await recordStripeWebhookReceived(event.id);

    return {
      received: true,
      eventId: event.id,
      eventType: event.type,
      status: "processed",
      duplicate: false,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Webhook-Verarbeitung fehlgeschlagen.";

    await markWebhookEvent(recordId, "failed", message);
    await recordStripeError(message);

    throw error;
  }
}
