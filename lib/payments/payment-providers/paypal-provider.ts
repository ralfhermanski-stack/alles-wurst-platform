/**
 * @file paypal-provider.ts
 * @purpose PayPal-Adapter — vorbereitet, noch ohne echte API.
 */

import type { PaymentProviderAdapter } from "./types";

export const paypalPaymentProvider: PaymentProviderAdapter = {
  id: "paypal",
  async preparePayment(context) {
    // Vorbereitet: später PayPal Order erstellen.
    console.info(
      `[payments:paypal] Vorbereitet — Checkout ${context.checkoutIntentId} (${context.grossAmount} ${context.currency})`,
    );

    return {
      status: "awaiting_payment",
      providerMetadata: {
        mode: "paypal_stub",
        hint: "PayPal-API noch nicht angebunden.",
      },
    };
  },
};
