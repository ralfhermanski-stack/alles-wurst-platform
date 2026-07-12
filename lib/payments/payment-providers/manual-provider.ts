/**
 * @file manual-provider.ts
 * @purpose Manuelle Zahlung — Buchhaltung markiert Position später als bezahlt.
 */

import type { PaymentProviderAdapter } from "./types";

export const manualPaymentProvider: PaymentProviderAdapter = {
  id: "manual",
  async preparePayment() {
    return {
      status: "awaiting_payment",
      providerMetadata: {
        mode: "manual",
        hint: "Zahlung wird von der Buchhaltung manuell bestätigt.",
      },
    };
  },
};
