/**
 * @file provider-registry.ts
 * @purpose Registry für Zahlungsanbieter-Adapter.
 */

import type { PaymentProvider } from "@prisma/client";

import { bankTransferPaymentProvider } from "./bank-transfer-provider";
import { manualPaymentProvider } from "./manual-provider";
import { paypalPaymentProvider } from "./paypal-provider";
import { stripePaymentProvider } from "./stripe-provider";
import type { PaymentProviderAdapter } from "./types";

const PROVIDERS: Record<PaymentProvider, PaymentProviderAdapter> = {
  stripe: stripePaymentProvider,
  paypal: paypalPaymentProvider,
  bank_transfer: bankTransferPaymentProvider,
  manual: manualPaymentProvider,
};

export function getPaymentProviderAdapter(
  provider: PaymentProvider,
): PaymentProviderAdapter {
  return PROVIDERS[provider];
}
