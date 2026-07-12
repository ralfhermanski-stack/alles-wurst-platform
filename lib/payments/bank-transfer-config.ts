/**
 * @file bank-transfer-config.ts
 * @purpose Überweisungsdaten aus ENV für die Checkout-UI.
 */

export type BankTransferConfig = {
  recipient: string;
  iban: string;
  bic: string | null;
};

export type BankTransferDisplay = BankTransferConfig & {
  amount: string;
  currency: string;
  reference: string;
};

/**
 * Liest die konfigurierten Bankverbindungsdaten.
 */
export function getBankTransferConfig(): BankTransferConfig {
  const recipient = process.env.BANK_TRANSFER_RECIPIENT?.trim();
  const iban = process.env.BANK_TRANSFER_IBAN?.trim();

  if (!recipient || !iban) {
    throw new Error(
      "BANK_TRANSFER_RECIPIENT und BANK_TRANSFER_IBAN müssen gesetzt sein.",
    );
  }

  const bic = process.env.BANK_TRANSFER_BIC?.trim() || null;

  return { recipient, iban, bic };
}

/**
 * Baut die Anzeige für eine Überweisung im Checkout.
 */
export function buildBankTransferDisplay(input: {
  grossAmount: number;
  currency: string;
  reference: string;
}): BankTransferDisplay {
  const config = getBankTransferConfig();

  const amount = new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: input.currency,
  }).format(input.grossAmount);

  return {
    ...config,
    amount,
    currency: input.currency,
    reference: input.reference,
  };
}
