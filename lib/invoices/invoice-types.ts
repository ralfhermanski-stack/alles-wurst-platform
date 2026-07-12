/**
 * @file invoice-types.ts
 * @purpose Typen für Rechnungen.
 */

import type {
  AccountingPositionPaymentStatus,
  AccountingProductType,
  Invoice,
  InvoiceStatus,
} from "@prisma/client";

export type InvoiceCustomerSnapshot = {
  email: string;
  salutation: string | null;
  firstName: string;
  lastName: string;
  company: string | null;
  street: string;
  houseNumber: string;
  addressLine2: string | null;
  postalCode: string;
  city: string;
  stateRegion: string | null;
  country: string;
};

export type InvoiceEntry = {
  id: string;
  invoiceNumber: string;
  sequenceNumber: number;
  sequenceYear: number;
  accountingPositionId: string;
  userId: string;
  invoiceDate: string;
  serviceDate: string;
  dueDate: string | null;
  status: InvoiceStatus;
  paymentStatus: AccountingPositionPaymentStatus;
  customer: InvoiceCustomerSnapshot;
  productType: AccountingProductType;
  productName: string;
  netAmount: number;
  taxRate: number;
  taxAmount: number;
  grossAmount: number;
  currency: string;
  noteText: string | null;
  createdAt: string;
};

export type InvoiceSummary = {
  id: string;
  invoiceNumber: string;
};

export type InvoicePrintData = InvoiceEntry & {
  seller: {
    name: string;
    street: string;
    postalCode: string;
    city: string;
    country: string;
    vatId: string | null;
  };
  statusLabel: string;
  paymentStatusLabel: string;
  productTypeLabel: string;
};

export type CreditNoteEntry = {
  id: string;
  creditNoteNumber: string;
  sequenceNumber: number;
  sequenceYear: number;
  invoiceId: string;
  referenceInvoiceNumber: string;
  userId: string;
  creditNoteDate: string;
  customer: InvoiceCustomerSnapshot;
  productType: AccountingProductType;
  productName: string;
  netAmount: number;
  taxRate: number;
  taxAmount: number;
  grossAmount: number;
  currency: string;
  noteText: string | null;
  createdAt: string;
};

export type CreditNotePrintData = CreditNoteEntry & {
  seller: InvoicePrintData["seller"];
  productTypeLabel: string;
};

export function parseCustomerSnapshotFromJson(
  value: unknown,
): InvoiceCustomerSnapshot {
  if (typeof value !== "object" || value === null) {
    throw new Error("Ungültiger Kunden-Snapshot.");
  }

  const snapshot = value as Record<string, unknown>;

  return {
    email: String(snapshot.email ?? ""),
    salutation:
      typeof snapshot.salutation === "string" ? snapshot.salutation : null,
    firstName: String(snapshot.firstName ?? ""),
    lastName: String(snapshot.lastName ?? ""),
    company: typeof snapshot.company === "string" ? snapshot.company : null,
    street: String(snapshot.street ?? ""),
    houseNumber: String(snapshot.houseNumber ?? ""),
    addressLine2:
      typeof snapshot.addressLine2 === "string" ? snapshot.addressLine2 : null,
    postalCode: String(snapshot.postalCode ?? ""),
    city: String(snapshot.city ?? ""),
    stateRegion:
      typeof snapshot.stateRegion === "string" ? snapshot.stateRegion : null,
    country: String(snapshot.country ?? "DE"),
  };
}

function parseCustomerSnapshot(value: unknown): InvoiceCustomerSnapshot {
  return parseCustomerSnapshotFromJson(value);
}

export function toInvoiceEntry(invoice: Invoice): InvoiceEntry {
  return {
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    sequenceNumber: invoice.sequenceNumber,
    sequenceYear: invoice.sequenceYear,
    accountingPositionId: invoice.accountingPositionId,
    userId: invoice.userId,
    invoiceDate: invoice.invoiceDate.toISOString(),
    serviceDate: invoice.serviceDate.toISOString(),
    dueDate: invoice.dueDate?.toISOString() ?? null,
    status: invoice.status,
    paymentStatus: invoice.paymentStatus,
    customer: parseCustomerSnapshot(invoice.customerSnapshot),
    productType: invoice.productType,
    productName: invoice.productName,
    netAmount: invoice.netAmount.toNumber(),
    taxRate: invoice.taxRate.toNumber(),
    taxAmount: invoice.taxAmount.toNumber(),
    grossAmount: invoice.grossAmount.toNumber(),
    currency: invoice.currency,
    noteText: invoice.noteText,
    createdAt: invoice.createdAt.toISOString(),
  };
}

export function toInvoiceSummary(invoice: Invoice): InvoiceSummary {
  return {
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
  };
}
