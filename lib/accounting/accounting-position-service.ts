/**
 * @file accounting-position-service.ts
 * @purpose Kurskosten und manuelle Buchhaltungspositionen.
 */

import type { AccountingPosition } from "@prisma/client";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { findUserById } from "@/lib/users/user-service";
import {
  userFailure,
  userSuccess,
  type UserServiceResult,
} from "@/lib/users/user-errors";

import { handleAccountingPositionPaid } from "@/lib/payments/checkout-intent-service";

import { createAccountingAuditLog } from "./accounting-audit";
import type { AccountingActor } from "./accounting-types";
import {
  ACCOUNTING_POSITION_STATUS_LABELS,
  ACCOUNTING_PRODUCT_TYPE_LABELS,
} from "./accounting-position-labels";
import type {
  AccountingPositionEntry,
  AccountingPositionTotals,
  CreateAccountingPositionInput,
  UpdateAccountingPositionStatusInput,
} from "./accounting-position-types";
import {
  calculatePositionTotals,
  toPositionEntry,
  toPositionSnapshot,
} from "./accounting-position-types";

const POSITION_INVOICE_SELECT = {
  id: true,
  invoiceNumber: true,
  status: true,
  creditNote: { select: { id: true, creditNoteNumber: true } },
} as const;

function parseDateInput(value: string | null | undefined): Date | null {
  if (!value?.trim()) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function validateAmounts(input: CreateAccountingPositionInput): string | null {
  if (input.grossAmount < 0 || input.netAmount < 0 || input.taxAmount < 0) {
    return "Beträge dürfen nicht negativ sein.";
  }

  if (input.taxRate < 0 || input.taxRate > 100) {
    return "Steuersatz muss zwischen 0 und 100 liegen.";
  }

  if (!input.productName.trim()) {
    return "Produktname ist erforderlich.";
  }

  return null;
}

async function getPositionOrFail(
  positionId: string,
  userId: string,
): Promise<UserServiceResult<AccountingPosition>> {
  const position = await prisma.accountingPosition.findFirst({
    where: { id: positionId, userId },
    include: {
      checkoutIntent: { select: { id: true } },
      invoice: { select: POSITION_INVOICE_SELECT },
    },
  });

  if (!position) {
    return userFailure({
      code: "NOT_FOUND",
      message: "Buchhaltungsposition wurde nicht gefunden.",
    });
  }

  return userSuccess(position);
}

/**
 * Listet alle Buchhaltungspositionen eines Nutzers.
 */
export async function listAccountingPositions(
  userId: string,
): Promise<UserServiceResult<AccountingPositionEntry[]>> {
  try {
    const positions = await prisma.accountingPosition.findMany({
      where: { userId },
      include: {
        checkoutIntent: { select: { id: true } },
        invoice: { select: POSITION_INVOICE_SELECT },
      },
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
    });

    return userSuccess(positions.map(toPositionEntry));
  } catch {
    return userFailure({
      code: "INTERNAL_ERROR",
      message: "Buchhaltungspositionen konnten nicht geladen werden.",
    });
  }
}

/**
 * Berechnet Summen offener und bezahlter Beträge.
 */
export async function getAccountingPositionTotals(
  userId: string,
): Promise<UserServiceResult<AccountingPositionTotals>> {
  const result = await listAccountingPositions(userId);

  if (!result.success) {
    return result;
  }

  return userSuccess(calculatePositionTotals(result.data));
}

/**
 * Legt eine manuelle Buchhaltungsposition an.
 */
export async function createAccountingPosition(
  actor: AccountingActor,
  userId: string,
  input: CreateAccountingPositionInput,
): Promise<UserServiceResult<AccountingPositionEntry>> {
  const validationError = validateAmounts(input);

  if (validationError) {
    return userFailure({
      code: "VALIDATION_ERROR",
      message: validationError,
    });
  }

  const userResult = await findUserById(userId);

  if (!userResult.success) {
    return userResult;
  }

  if (!userResult.data) {
    return userFailure({
      code: "NOT_FOUND",
      message: "Nutzer wurde nicht gefunden.",
    });
  }

  try {
    const position = await prisma.accountingPosition.create({
      data: {
        userId,
        productType: input.productType,
        productName: input.productName.trim(),
        grossAmount: new Prisma.Decimal(input.grossAmount),
        netAmount: new Prisma.Decimal(input.netAmount),
        taxRate: new Prisma.Decimal(input.taxRate),
        taxAmount: new Prisma.Decimal(input.taxAmount),
        currency: input.currency?.trim() || "EUR",
        paymentStatus: input.paymentStatus ?? "pending",
        dueDate: parseDateInput(input.dueDate),
        paidAt: parseDateInput(input.paidAt),
        note: input.note?.trim() || null,
        productPriceId: input.productPriceId ?? null,
        paymentProvider: input.paymentProvider ?? null,
      },
    });

    await createAccountingAuditLog({
      targetUserId: userId,
      actorUserId: actor.userId,
      actorRole: actor.role,
      action: "position_create",
      summary: `${ACCOUNTING_PRODUCT_TYPE_LABELS[input.productType]} angelegt: ${input.productName} (${input.grossAmount.toFixed(2)} ${input.currency ?? "EUR"})`,
      newValues: toPositionSnapshot(position),
      note: input.note,
    });

    return userSuccess(toPositionEntry(position));
  } catch {
    return userFailure({
      code: "INTERNAL_ERROR",
      message: "Buchhaltungsposition konnte nicht angelegt werden.",
    });
  }
}

/**
 * Aktualisiert den Zahlungsstatus einer Position.
 */
export async function updateAccountingPositionStatus(
  actor: AccountingActor,
  userId: string,
  positionId: string,
  input: UpdateAccountingPositionStatusInput,
): Promise<UserServiceResult<AccountingPositionEntry>> {
  const existingResult = await getPositionOrFail(positionId, userId);

  if (!existingResult.success) {
    return existingResult;
  }

  const previous = existingResult.data;
  const previousSnapshot = toPositionSnapshot(previous);

  let paidAt = parseDateInput(input.paidAt);

  if (input.paymentStatus === "paid" && !paidAt) {
    paidAt = new Date();
  }

  if (input.paymentStatus !== "paid") {
    paidAt = input.paidAt === null ? null : paidAt;
  }

  try {
    const position = await prisma.accountingPosition.update({
      where: { id: positionId },
      data: {
        paymentStatus: input.paymentStatus,
        paidAt:
          input.paymentStatus === "paid"
            ? paidAt
            : input.paymentStatus === "pending" ||
                input.paymentStatus === "overdue" ||
                input.paymentStatus === "cancelled"
              ? null
              : previous.paidAt,
        note: input.note !== undefined ? input.note?.trim() || null : undefined,
      },
      include: {
        checkoutIntent: { select: { id: true } },
        invoice: { select: POSITION_INVOICE_SELECT },
      },
    });

    if (position.invoice) {
      if (
        input.paymentStatus === "paid" &&
        (position.invoice.status === "issued" ||
          position.invoice.status === "draft")
      ) {
        await prisma.invoice.update({
          where: { id: position.invoice.id },
          data: { status: "paid", paymentStatus: "paid" },
        });
      } else if (
        input.paymentStatus === "pending" ||
        input.paymentStatus === "overdue"
      ) {
        await prisma.invoice.update({
          where: { id: position.invoice.id },
          data: { paymentStatus: input.paymentStatus },
        });
      }
    }

    if (input.paymentStatus === "paid") {
      const fulfillmentResult = await handleAccountingPositionPaid(positionId);

      if (!fulfillmentResult.success) {
        console.error(
          `[accounting] Fulfillment nach Zahlung fehlgeschlagen (Position ${positionId}).`,
        );
      }

      if (position.productPriceId) {
        const { grantCourseAccessFromAccountingPosition } = await import(
          "@/lib/courses/course-access-service"
        );

        await grantCourseAccessFromAccountingPosition({
          userId,
          positionId,
          productPriceId: position.productPriceId,
        });
      }
    }

    await createAccountingAuditLog({
      targetUserId: userId,
      actorUserId: actor.userId,
      actorRole: actor.role,
      action: "position_status_change",
      summary: `${previous.productName}: ${ACCOUNTING_POSITION_STATUS_LABELS[input.paymentStatus]}`,
      previousValues: previousSnapshot,
      newValues: toPositionSnapshot(position),
      note: input.note,
    });

    return userSuccess(toPositionEntry(position));
  } catch {
    return userFailure({
      code: "INTERNAL_ERROR",
      message: "Zahlungsstatus konnte nicht aktualisiert werden.",
    });
  }
}
