/**
 * @file invoice-config.ts
 * @purpose Rechnungssteller und Standard-Hinweistext aus ENV.
 */

export type InvoiceSellerConfig = {
  name: string;
  street: string;
  postalCode: string;
  city: string;
  country: string;
  vatId: string | null;
};

export function getInvoiceSellerConfig(): InvoiceSellerConfig {
  const name = process.env.INVOICE_SELLER_NAME?.trim() ?? "Alles Wurst";
  const street =
    process.env.INVOICE_SELLER_STREET?.trim() ?? "Musterstraße 1";
  const postalCode = process.env.INVOICE_SELLER_POSTAL_CODE?.trim() ?? "12345";
  const city = process.env.INVOICE_SELLER_CITY?.trim() ?? "Musterstadt";
  const country = process.env.INVOICE_SELLER_COUNTRY?.trim() ?? "Deutschland";
  const vatId = process.env.INVOICE_SELLER_VAT_ID?.trim() || null;

  return {
    name,
    street,
    postalCode,
    city,
    country,
    vatId,
  };
}

export function getDefaultInvoiceNote(): string | null {
  const note = process.env.INVOICE_DEFAULT_NOTE?.trim();

  return note || null;
}

export function getInvoiceNumberPrefix(): string {
  return process.env.INVOICE_NUMBER_PREFIX?.trim() || "RE";
}

export function getCreditNoteNumberPrefix(): string {
  return process.env.CREDIT_NOTE_NUMBER_PREFIX?.trim() || "GS";
}
