/**
 * @file stripe-provider.ts
 * @purpose Stripe-Adapter — Checkout Session wird in der Checkout-API erstellt.
 */

import { isStripeCheckoutEnabled } from "@/lib/stripe/stripe-settings-service";

import type { PaymentProviderAdapter } from "./types";

export const stripePaymentProvider: PaymentProviderAdapter = {
  id: "stripe",
  async preparePayment(context) {
    const enabled = await isStripeCheckoutEnabled();

    if (!enabled) {
      throw new Error(
        "Stripe ist nicht konfiguriert oder der aktive Modus ist unvollständig.",
      );
    }

    return {
      status: "awaiting_payment",
      providerMetadata: {
        mode: "stripe_checkout",
        checkoutIntentId: context.checkoutIntentId,
        hint: "Weiterleitung zu Stripe Checkout nach Intent-Erstellung.",
      },
    };
  },
};
