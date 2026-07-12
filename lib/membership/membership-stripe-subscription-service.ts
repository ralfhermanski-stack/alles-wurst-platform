/**
 * @file membership-stripe-subscription-service.ts
 * @purpose Stripe-Abo: Kündigung zum Periodenende, Status-Sync.
 */

import type { StripeActiveMode } from "@prisma/client";
import type Stripe from "stripe";

import { prisma } from "@/lib/db/prisma";
import { getStripeClient } from "@/lib/stripe/stripe-client";
import { getActiveStripeMode } from "@/lib/stripe/stripe-settings-service";
import { ensureStripeKeyCache } from "@/lib/stripe/stripe-key-store";

const MEMBERSHIP_PRODUCT_KINDS = [
  "membership_wurstclub",
  "membership_meisterclub",
] as const;

export type ResolvedStripeSubscription = {
  subscriptionId: string;
  mode: StripeActiveMode;
  paymentIntentId: string;
};

export async function findLatestMembershipStripeSubscription(
  userId: string,
): Promise<ResolvedStripeSubscription | null> {
  const payment = await prisma.paymentIntent.findFirst({
    where: {
      status: "succeeded",
      stripeSubscriptionId: { not: null },
      checkoutIntent: {
        userId,
        status: "succeeded",
        productPrice: {
          product: {
            kind: { in: [...MEMBERSHIP_PRODUCT_KINDS] },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      stripeSubscriptionId: true,
    },
  });

  if (!payment?.stripeSubscriptionId) {
    return null;
  }

  await ensureStripeKeyCache();
  const mode = await getActiveStripeMode();

  return {
    subscriptionId: payment.stripeSubscriptionId,
    mode,
    paymentIntentId: payment.id,
  };
}

export async function cancelStripeSubscriptionAtPeriodEnd(input: {
  userId: string;
  subscriptionId?: string;
}): Promise<{ cancelled: boolean; subscriptionId: string | null; error?: string }> {
  try {
    await ensureStripeKeyCache();
    const resolved =
      input.subscriptionId != null
        ? {
            subscriptionId: input.subscriptionId,
            mode: await getActiveStripeMode(),
            paymentIntentId: "",
          }
        : await findLatestMembershipStripeSubscription(input.userId);

    if (!resolved) {
      return { cancelled: false, subscriptionId: null };
    }

    const stripe = getStripeClient(resolved.mode);
    const subscription = await stripe.subscriptions.update(
      resolved.subscriptionId,
      { cancel_at_period_end: true },
    );

    return {
      cancelled: subscription.cancel_at_period_end === true,
      subscriptionId: subscription.id,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Stripe-Kündigung fehlgeschlagen.";
    console.error("[membership/stripe] cancel_at_period_end:", message);
    return {
      cancelled: false,
      subscriptionId: input.subscriptionId ?? null,
      error: message,
    };
  }
}

export async function syncMembershipFromStripeSubscription(
  subscription: Stripe.Subscription,
): Promise<void> {
  const subscriptionId = subscription.id;

  const payment = await prisma.paymentIntent.findFirst({
    where: { stripeSubscriptionId: subscriptionId },
    include: {
      checkoutIntent: {
        select: { userId: true },
      },
    },
  });

  if (!payment?.checkoutIntent) {
    return;
  }

  const periodEnd = subscription.current_period_end
    ? new Date(subscription.current_period_end * 1000)
    : null;

  await prisma.membership.updateMany({
    where: { userId: payment.checkoutIntent.userId },
    data: {
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      autoRenewEnabled: !subscription.cancel_at_period_end,
      ...(subscription.cancel_at_period_end
        ? {
            cancelReason: "stripe_sync",
            cancelRequestedAt: new Date(),
          }
        : {}),
      ...(periodEnd
        ? {
            endsAt: periodEnd,
            extendedUntil: periodEnd,
          }
        : {}),
    },
  });
}

export async function reactivateStripeSubscriptionRenewal(
  userId: string,
): Promise<{ reactivated: boolean; error?: string }> {
  try {
    const resolved = await findLatestMembershipStripeSubscription(userId);

    if (!resolved) {
      return { reactivated: false };
    }

    const stripe = getStripeClient(resolved.mode);
    await stripe.subscriptions.update(resolved.subscriptionId, {
      cancel_at_period_end: false,
    });

    return { reactivated: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Stripe-Reaktivierung fehlgeschlagen.";
    return { reactivated: false, error: message };
  }
}
