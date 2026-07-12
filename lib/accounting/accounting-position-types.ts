/**
 * @file accounting-position-types.ts
 * @purpose Typen für Kurskosten und Buchhaltungspositionen.
 */

import type {
  AccountingPosition,
  AccountingPositionPaymentStatus,
  AccountingProductType,
  InvoiceStatus,
  PaymentProvider,
} from "@prisma/client";

export type AccountingPositionEntry = {
  id: string;
  userId: string;
  productType: AccountingProductType;
  productName: string;
  grossAmount: number;
  netAmount: number;
  taxRate: number;
  taxAmount: number;
  currency: string;
  paymentStatus: AccountingPositionPaymentStatus;
  dueDate: string | null;
  paidAt: string | null;
  note: string | null;
  productPriceId: string | null;
  paymentProvider: PaymentProvider | null;
  checkoutIntentId: string | null;
  invoiceId: string | null;
  invoiceNumber: string | null;
  invoiceStatus: InvoiceStatus | null;
  creditNoteId: string | null;
  creditNoteNumber: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AccountingPositionTotals = {
  currency: string;
  openAmount: number;
  paidAmount: number;
  openCount: number;
  paidCount: number;
};

export type CreateAccountingPositionInput = {
  productType: AccountingProductType;
  productName: string;
  grossAmount: number;
  netAmount: number;
  taxRate: number;
  taxAmount: number;
  currency?: string;
  paymentStatus?: AccountingPositionPaymentStatus;
  dueDate?: string | null;
  paidAt?: string | null;
  note?: string | null;
  productPriceId?: string | null;
  paymentProvider?: PaymentProvider | null;
};

export type UpdateAccountingPositionStatusInput = {
  paymentStatus: AccountingPositionPaymentStatus;
  paidAt?: string | null;
  note?: string | null;
};

export type AccountingPositionSnapshot = Pick<
  AccountingPosition,
  | "id"
  | "productType"
  | "productName"
  | "grossAmount"
  | "netAmount"
  | "taxRate"
  | "taxAmount"
  | "currency"
  | "paymentStatus"
  | "dueDate"
  | "paidAt"
  | "note"
>;

export function toPositionEntry(
  position: AccountingPosition & {
    checkoutIntent?: { id: string } | null;
    invoice?: {
      id: string;
      invoiceNumber: string;
      status: InvoiceStatus;
      creditNote?: { id: string; creditNoteNumber: string } | null;
    } | null;
  },
): AccountingPositionEntry {
  return {
    id: position.id,
    userId: position.userId,
    productType: position.productType,
    productName: position.productName,
    grossAmount: position.grossAmount.toNumber(),
    netAmount: position.netAmount.toNumber(),
    taxRate: position.taxRate.toNumber(),
    taxAmount: position.taxAmount.toNumber(),
    currency: position.currency,
    paymentStatus: position.paymentStatus,
    dueDate: position.dueDate?.toISOString() ?? null,
    paidAt: position.paidAt?.toISOString() ?? null,
    note: position.note,
    productPriceId: position.productPriceId,
    paymentProvider: position.paymentProvider,
    checkoutIntentId: position.checkoutIntent?.id ?? null,
    invoiceId: position.invoice?.id ?? null,
    invoiceNumber: position.invoice?.invoiceNumber ?? null,
    invoiceStatus: position.invoice?.status ?? null,
    creditNoteId: position.invoice?.creditNote?.id ?? null,
    creditNoteNumber: position.invoice?.creditNote?.creditNoteNumber ?? null,
    createdAt: position.createdAt.toISOString(),
    updatedAt: position.updatedAt.toISOString(),
  };
}

export function toPositionSnapshot(
  position: AccountingPosition,
): Record<string, unknown> {
  return {
    id: position.id,
    productType: position.productType,
    productName: position.productName,
    grossAmount: position.grossAmount.toNumber(),
    netAmount: position.netAmount.toNumber(),
    taxRate: position.taxRate.toNumber(),
    taxAmount: position.taxAmount.toNumber(),
    currency: position.currency,
    paymentStatus: position.paymentStatus,
    dueDate: position.dueDate?.toISOString() ?? null,
    paidAt: position.paidAt?.toISOString() ?? null,
    note: position.note,
    productPriceId: position.productPriceId,
    paymentProvider: position.paymentProvider,
  };
}

export function calculatePositionTotals(
  positions: AccountingPositionEntry[],
): AccountingPositionTotals {
  const currency = positions[0]?.currency ?? "EUR";

  let openAmount = 0;
  let paidAmount = 0;
  let openCount = 0;
  let paidCount = 0;

  for (const position of positions) {
    if (
      position.paymentStatus === "pending" ||
      position.paymentStatus === "overdue"
    ) {
      openAmount += position.grossAmount;
      openCount += 1;
    }

    if (position.paymentStatus === "paid") {
      paidAmount += position.grossAmount;
      paidCount += 1;
    }
  }

  return {
    currency,
    openAmount: Math.round(openAmount * 100) / 100,
    paidAmount: Math.round(paidAmount * 100) / 100,
    openCount,
    paidCount,
  };
}
