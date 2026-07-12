/**
 * @file bank-transfer-provider.ts
 * @purpose Überweisung — wartet auf manuelle Zuordnung durch Buchhaltung.
 */

import type { PaymentProviderAdapter } from "./types";

const BANK_TRANSFER_REFERENCE_PREFIX = "AW-";

export const bankTransferPaymentProvider: PaymentProviderAdapter = {
  id: "bank_transfer",
  async preparePayment(context) {
    const reference = `${BANK_TRANSFER_REFERENCE_PREFIX}${context.checkoutIntentId.slice(0, 8).toUpperCase()}`;

    return {
      status: "awaiting_payment",
      providerReference: reference,
      providerMetadata: {
        mode: "bank_transfer",
        paymentReference: reference,
        hint: "Bitte Verwendungszweck bei der Überweisung angeben.",
      },
    };
  },
};
