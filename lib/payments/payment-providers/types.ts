/**
 * @file payment-providers/types.ts
 * @purpose Adapter-Schnittstelle für Zahlungsanbieter.
 */

import type { PaymentProvider } from "@prisma/client";

export type PaymentProviderContext = {
  checkoutIntentId: string;
  userId: string;
  grossAmount: number;
  currency: string;
  productName: string;
};

export type PaymentProviderPrepareResult = {
  status: "awaiting_payment" | "processing";
  providerReference?: string;
  providerMetadata?: Record<string, string | number | boolean | null>;
};

export type PaymentProviderAdapter = {
  id: PaymentProvider;
  preparePayment: (
    context: PaymentProviderContext,
  ) => Promise<PaymentProviderPrepareResult>;
};
