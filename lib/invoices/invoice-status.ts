/**
 * @file invoice-status.ts
 * @purpose Abbildung zwischen Positions- und Rechnungsstatus.
 */

import type {
  AccountingPositionPaymentStatus,
  InvoiceStatus,
} from "@prisma/client";

export function mapPositionPaymentToInvoiceStatus(
  paymentStatus: AccountingPositionPaymentStatus,
): InvoiceStatus {
  if (paymentStatus === "paid") {
    return "paid";
  }

  return "issued";
}

export function mapInvoiceCancelToPositionStatus(): AccountingPositionPaymentStatus {
  return "cancelled";
}

export function mapCreditNoteToPositionStatus(): AccountingPositionPaymentStatus {
  return "refunded";
}

export function canCancelInvoice(status: InvoiceStatus): boolean {
  return status === "draft" || status === "issued" || status === "paid";
}

export function canCreateCreditNote(
  status: InvoiceStatus,
  hasCreditNote: boolean,
): boolean {
  if (hasCreditNote) {
    return false;
  }

  return status === "paid" || status === "cancelled" || status === "issued";
}
