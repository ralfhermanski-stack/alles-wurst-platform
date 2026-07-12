/**
 * @file credit-note-service.ts
 * @purpose Gutschriften zu Rechnungen erzeugen und laden.
 */

import type { CreditNote } from "@prisma/client";
import { Prisma } from "@prisma/client";

import { createAccountingAuditLog } from "@/lib/accounting/accounting-audit";
import type { AccountingActor } from "@/lib/accounting/accounting-types";
import { ACCOUNTING_PRODUCT_TYPE_LABELS } from "@/lib/accounting/accounting-position-labels";
import { prisma } from "@/lib/db/prisma";
import {
  userFailure,
  userSuccess,
  type UserServiceResult,
} from "@/lib/users/user-errors";

import {
  getCreditNoteNumberPrefix,
  getInvoiceSellerConfig,
} from "./invoice-config";
import {
  canCreateCreditNote,
  mapCreditNoteToPositionStatus,
} from "./invoice-status";
import type { CreditNoteEntry, CreditNotePrintData } from "./invoice-types";
import { parseCustomerSnapshotFromJson } from "./invoice-types";

const DEFAULT_CREDIT_NOTE_NOTE =
  "Gutschrift zu der oben genannten Rechnung. Der Betrag wird erstattet bzw. mit offenen Forderungen verrechnet.";

function formatCreditNoteNumber(
  prefix: string,
  year: number,
  sequenceNumber: number,
): string {
  return `${prefix}-${year}-${String(sequenceNumber).padStart(5, "0")}`;
}

async function allocateCreditNoteNumber(
  tx: Prisma.TransactionClient,
): Promise<{
  creditNoteNumber: string;
  sequenceNumber: number;
  sequenceYear: number;
}> {
  const prefix = getCreditNoteNumberPrefix();
  const sequenceYear = new Date().getFullYear();

  const existing = await tx.creditNoteSequence.findUnique({
    where: { id: "default" },
  });

  const sequenceNumber = (existing?.currentNumber ?? 0) + 1;

  await tx.creditNoteSequence.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      currentNumber: sequenceNumber,
      prefix,
    },
    update: {
      currentNumber: sequenceNumber,
      prefix,
    },
  });

  return {
    creditNoteNumber: formatCreditNoteNumber(prefix, sequenceYear, sequenceNumber),
    sequenceNumber,
    sequenceYear,
  };
}

export function toCreditNoteEntry(creditNote: CreditNote): CreditNoteEntry {
  return {
    id: creditNote.id,
    creditNoteNumber: creditNote.creditNoteNumber,
    sequenceNumber: creditNote.sequenceNumber,
    sequenceYear: creditNote.sequenceYear,
    invoiceId: creditNote.invoiceId,
    referenceInvoiceNumber: creditNote.referenceInvoiceNumber,
    userId: creditNote.userId,
    creditNoteDate: creditNote.creditNoteDate.toISOString(),
    customer: parseCustomerSnapshotFromJson(creditNote.customerSnapshot),
    productType: creditNote.productType,
    productName: creditNote.productName,
    netAmount: creditNote.netAmount.toNumber(),
    taxRate: creditNote.taxRate.toNumber(),
    taxAmount: creditNote.taxAmount.toNumber(),
    grossAmount: creditNote.grossAmount.toNumber(),
    currency: creditNote.currency,
    noteText: creditNote.noteText,
    createdAt: creditNote.createdAt.toISOString(),
  };
}

/**
 * Erstellt eine Gutschrift zu einer Rechnung (idempotent).
 */
export async function createCreditNoteFromInvoice(
  actor: AccountingActor,
  invoiceId: string,
): Promise<UserServiceResult<CreditNoteEntry>> {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { creditNote: true },
    });

    if (!invoice) {
      return userFailure({
        code: "NOT_FOUND",
        message: "Rechnung wurde nicht gefunden.",
      });
    }

    if (invoice.creditNote) {
      return userSuccess(toCreditNoteEntry(invoice.creditNote));
    }

    if (!canCreateCreditNote(invoice.status, false)) {
      return userFailure({
        code: "VALIDATION_ERROR",
        message:
          "Für diese Rechnung kann keine Gutschrift erstellt werden (bereits erstattet oder ungültiger Status).",
      });
    }

    const now = new Date();

    const creditNote = await prisma.$transaction(async (tx) => {
      const existing = await tx.creditNote.findUnique({
        where: { invoiceId: invoice.id },
      });

      if (existing) {
        return existing;
      }

      const numbering = await allocateCreditNoteNumber(tx);

      const created = await tx.creditNote.create({
        data: {
          creditNoteNumber: numbering.creditNoteNumber,
          sequenceNumber: numbering.sequenceNumber,
          sequenceYear: numbering.sequenceYear,
          invoiceId: invoice.id,
          userId: invoice.userId,
          creditNoteDate: now,
          referenceInvoiceNumber: invoice.invoiceNumber,
          customerSnapshot: invoice.customerSnapshot as Prisma.InputJsonValue,
          productType: invoice.productType,
          productName: invoice.productName,
          netAmount: invoice.netAmount,
          taxRate: invoice.taxRate,
          taxAmount: invoice.taxAmount,
          grossAmount: invoice.grossAmount,
          currency: invoice.currency,
          noteText: DEFAULT_CREDIT_NOTE_NOTE,
          createdByUserId: actor.userId,
        },
      });

      await tx.invoice.update({
        where: { id: invoice.id },
        data: { status: "refunded" },
      });

      await tx.accountingPosition.update({
        where: { id: invoice.accountingPositionId },
        data: {
          paymentStatus: mapCreditNoteToPositionStatus(),
          paidAt: null,
        },
      });

      return created;
    });

    if (!invoice.creditNote) {
      await createAccountingAuditLog({
        targetUserId: invoice.userId,
        actorUserId: actor.userId,
        actorRole: actor.role,
        action: "credit_note_create",
        summary: `Gutschrift ${creditNote.creditNoteNumber} zu Rechnung ${invoice.invoiceNumber}`,
        newValues: {
          creditNoteId: creditNote.id,
          creditNoteNumber: creditNote.creditNoteNumber,
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
        },
      });
    }

    return userSuccess(toCreditNoteEntry(creditNote));
  } catch {
    return userFailure({
      code: "INTERNAL_ERROR",
      message: "Gutschrift konnte nicht erstellt werden.",
    });
  }
}

/**
 * Lädt Gutschrift-Daten für die Druckansicht.
 */
export async function getCreditNotePrintData(
  creditNoteId: string,
): Promise<UserServiceResult<CreditNotePrintData | null>> {
  try {
    const creditNote = await prisma.creditNote.findUnique({
      where: { id: creditNoteId },
    });

    if (!creditNote) {
      return userSuccess(null);
    }

    const entry = toCreditNoteEntry(creditNote);

    return userSuccess({
      ...entry,
      seller: getInvoiceSellerConfig(),
      productTypeLabel: ACCOUNTING_PRODUCT_TYPE_LABELS[entry.productType],
    });
  } catch {
    return userFailure({
      code: "INTERNAL_ERROR",
      message: "Gutschrift konnte nicht geladen werden.",
    });
  }
}
