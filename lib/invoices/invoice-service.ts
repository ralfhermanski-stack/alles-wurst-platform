/**
 * @file invoice-service.ts
 * @purpose Rechnungen aus Buchhaltungspositionen erzeugen und laden.
 */

import type { UserProfile } from "@prisma/client";
import { Prisma } from "@prisma/client";

import { createAccountingAuditLog } from "@/lib/accounting/accounting-audit";
import type { AccountingActor } from "@/lib/accounting/accounting-types";
import { ACCOUNTING_POSITION_STATUS_LABELS } from "@/lib/accounting/accounting-position-labels";
import { ACCOUNTING_PRODUCT_TYPE_LABELS } from "@/lib/accounting/accounting-position-labels";
import { prisma } from "@/lib/db/prisma";
import {
  userFailure,
  userSuccess,
  type UserServiceResult,
} from "@/lib/users/user-errors";

import {
  getDefaultInvoiceNote,
  getInvoiceNumberPrefix,
  getInvoiceSellerConfig,
} from "./invoice-config";
import { INVOICE_STATUS_LABELS } from "./invoice-labels";
import {
  canCancelInvoice,
  mapInvoiceCancelToPositionStatus,
  mapPositionPaymentToInvoiceStatus,
} from "./invoice-status";
import type {
  InvoiceCustomerSnapshot,
  InvoiceEntry,
  InvoicePrintData,
} from "./invoice-types";
import { toInvoiceEntry } from "./invoice-types";

const BLOCKED_POSITION_STATUSES = new Set(["cancelled", "refunded"]);

function buildCustomerSnapshot(
  email: string,
  profile: UserProfile | null,
): InvoiceCustomerSnapshot | null {
  if (!profile) {
    return null;
  }

  return {
    email,
    salutation: profile.salutation,
    firstName: profile.firstName,
    lastName: profile.lastName,
    company: profile.company,
    street: profile.street,
    houseNumber: profile.houseNumber,
    addressLine2: profile.addressLine2,
    postalCode: profile.postalCode,
    city: profile.city,
    stateRegion: profile.stateRegion,
    country: profile.country,
  };
}

function formatInvoiceNumber(
  prefix: string,
  year: number,
  sequenceNumber: number,
): string {
  return `${prefix}-${year}-${String(sequenceNumber).padStart(5, "0")}`;
}

async function allocateInvoiceNumber(
  tx: Prisma.TransactionClient,
): Promise<{ invoiceNumber: string; sequenceNumber: number; sequenceYear: number }> {
  const prefix = getInvoiceNumberPrefix();
  const sequenceYear = new Date().getFullYear();

  const existing = await tx.invoiceSequence.findUnique({
    where: { id: "default" },
  });

  const sequenceNumber = (existing?.currentNumber ?? 0) + 1;

  await tx.invoiceSequence.upsert({
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
    invoiceNumber: formatInvoiceNumber(prefix, sequenceYear, sequenceNumber),
    sequenceNumber,
    sequenceYear,
  };
}

/**
 * Erzeugt eine Rechnung aus einer Buchhaltungsposition (idempotent bei bestehender Rechnung).
 */
export async function createInvoiceFromPosition(
  actor: AccountingActor,
  userId: string,
  positionId: string,
): Promise<UserServiceResult<InvoiceEntry>> {
  try {
    const position = await prisma.accountingPosition.findFirst({
      where: { id: positionId, userId },
      include: {
        user: { include: { profile: true } },
        invoice: true,
      },
    });

    if (!position) {
      return userFailure({
        code: "NOT_FOUND",
        message: "Buchhaltungsposition wurde nicht gefunden.",
      });
    }

    if (position.invoice) {
      return userSuccess(toInvoiceEntry(position.invoice));
    }

    if (BLOCKED_POSITION_STATUSES.has(position.paymentStatus)) {
      return userFailure({
        code: "VALIDATION_ERROR",
        message:
          "Für stornierte oder erstattete Positionen kann keine Rechnung erzeugt werden.",
      });
    }

    const customer = buildCustomerSnapshot(position.user.email, position.user.profile);

    if (!customer) {
      return userFailure({
        code: "VALIDATION_ERROR",
        message:
          "Für die Rechnung ist ein vollständiges Nutzerprofil mit Adresse erforderlich.",
      });
    }

    const now = new Date();
    const serviceDate = position.paidAt ?? position.createdAt;
    const noteText =
      position.note?.trim() || getDefaultInvoiceNote() || null;

    const invoice = await prisma.$transaction(async (tx) => {
      const existing = await tx.invoice.findUnique({
        where: { accountingPositionId: position.id },
      });

      if (existing) {
        return existing;
      }

      const numbering = await allocateInvoiceNumber(tx);

      const created = await tx.invoice.create({
        data: {
          invoiceNumber: numbering.invoiceNumber,
          sequenceNumber: numbering.sequenceNumber,
          sequenceYear: numbering.sequenceYear,
          accountingPositionId: position.id,
          userId: position.userId,
          invoiceDate: now,
          serviceDate,
          dueDate: position.dueDate,
          status: mapPositionPaymentToInvoiceStatus(position.paymentStatus),
          paymentStatus: position.paymentStatus,
          customerSnapshot: customer,
          productType: position.productType,
          productName: position.productName,
          netAmount: position.netAmount,
          taxRate: position.taxRate,
          taxAmount: position.taxAmount,
          grossAmount: position.grossAmount,
          currency: position.currency,
          noteText,
          createdByUserId: actor.userId,
        },
      });

      return created;
    });

    if (!position.invoice) {
      await createAccountingAuditLog({
        targetUserId: userId,
        actorUserId: actor.userId,
        actorRole: actor.role,
        action: "invoice_create",
        summary: `Rechnung ${invoice.invoiceNumber} erzeugt: ${position.productName}`,
        newValues: {
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          accountingPositionId: position.id,
        },
      });
    }

    return userSuccess(toInvoiceEntry(invoice));
  } catch {
    return userFailure({
      code: "INTERNAL_ERROR",
      message: "Rechnung konnte nicht erzeugt werden.",
    });
  }
}

/**
 * Lädt eine Rechnung für die Druckansicht.
 */
export async function getInvoicePrintData(
  invoiceId: string,
): Promise<UserServiceResult<InvoicePrintData | null>> {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) {
      return userSuccess(null);
    }

    const seller = getInvoiceSellerConfig();
    const entry = toInvoiceEntry(invoice);

    return userSuccess({
      ...entry,
      seller,
      statusLabel: INVOICE_STATUS_LABELS[entry.status],
      paymentStatusLabel: ACCOUNTING_POSITION_STATUS_LABELS[entry.paymentStatus],
      productTypeLabel: ACCOUNTING_PRODUCT_TYPE_LABELS[entry.productType],
    });
  } catch {
    return userFailure({
      code: "INTERNAL_ERROR",
      message: "Rechnung konnte nicht geladen werden.",
    });
  }
}

/**
 * Lädt die Rechnung zu einer Buchhaltungsposition.
 */
export async function getInvoiceByPositionId(
  positionId: string,
): Promise<UserServiceResult<InvoiceEntry | null>> {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { accountingPositionId: positionId },
    });

    if (!invoice) {
      return userSuccess(null);
    }

    return userSuccess(toInvoiceEntry(invoice));
  } catch {
    return userFailure({
      code: "INTERNAL_ERROR",
      message: "Rechnung konnte nicht geladen werden.",
    });
  }
}

/**
 * Storniert eine Rechnung (Original bleibt erhalten).
 */
export async function cancelInvoice(
  actor: AccountingActor,
  invoiceId: string,
): Promise<UserServiceResult<InvoiceEntry>> {
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
      return userFailure({
        code: "VALIDATION_ERROR",
        message:
          "Rechnungen mit bestehender Gutschrift können nicht storniert werden.",
      });
    }

    if (!canCancelInvoice(invoice.status)) {
      return userFailure({
        code: "VALIDATION_ERROR",
        message: "Diese Rechnung ist bereits storniert oder erstattet.",
      });
    }

    const now = new Date();

    const updated = await prisma.$transaction(async (tx) => {
      const cancelled = await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          status: "cancelled",
          cancelledAt: now,
        },
      });

      await tx.accountingPosition.update({
        where: { id: invoice.accountingPositionId },
        data: {
          paymentStatus: mapInvoiceCancelToPositionStatus(),
          paidAt: null,
        },
      });

      return cancelled;
    });

    await createAccountingAuditLog({
      targetUserId: invoice.userId,
      actorUserId: actor.userId,
      actorRole: actor.role,
      action: "invoice_cancel",
      summary: `Rechnung ${invoice.invoiceNumber} storniert`,
      newValues: {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        accountingPositionId: invoice.accountingPositionId,
      },
    });

    return userSuccess(toInvoiceEntry(updated));
  } catch {
    return userFailure({
      code: "INTERNAL_ERROR",
      message: "Rechnung konnte nicht storniert werden.",
    });
  }
}
