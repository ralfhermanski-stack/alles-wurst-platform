/**
 * @file accounting-position-parser.ts
 * @purpose Parst API-Bodies für Buchhaltungspositionen.
 */

import type {
  AccountingPositionPaymentStatus,
  AccountingProductType,
} from "@prisma/client";

import type {
  CreateAccountingPositionInput,
  UpdateAccountingPositionStatusInput,
} from "./accounting-position-types";

const PRODUCT_TYPES: AccountingProductType[] = [
  "membership",
  "course",
  "workshop",
  "manual",
];

const POSITION_STATUSES: AccountingPositionPaymentStatus[] = [
  "pending",
  "paid",
  "overdue",
  "cancelled",
  "refunded",
];

function readString(
  body: Record<string, unknown>,
  key: string,
): string | undefined {
  const value = body[key];

  return typeof value === "string" ? value : undefined;
}

function readNumber(
  body: Record<string, unknown>,
  key: string,
): number | undefined {
  const value = body[key];

  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return undefined;
}

function readNullableString(
  body: Record<string, unknown>,
  key: string,
): string | null | undefined {
  const value = body[key];

  if (value === null) {
    return null;
  }

  return typeof value === "string" ? value : undefined;
}

/**
 * Parst Eingabedaten für eine neue Buchhaltungsposition.
 */
export function parseCreatePositionBody(
  body: Record<string, unknown>,
): CreateAccountingPositionInput | null {
  const productType = readString(body, "productType");
  const productName = readString(body, "productName");
  const grossAmount = readNumber(body, "grossAmount");
  const netAmount = readNumber(body, "netAmount");
  const taxRate = readNumber(body, "taxRate");
  const taxAmount = readNumber(body, "taxAmount");

  if (
    !productType ||
    !PRODUCT_TYPES.includes(productType as AccountingProductType) ||
    !productName?.trim() ||
    grossAmount === undefined ||
    netAmount === undefined ||
    taxRate === undefined ||
    taxAmount === undefined
  ) {
    return null;
  }

  const paymentStatus = readString(body, "paymentStatus");
  const currency = readString(body, "currency") ?? "EUR";

  return {
    productType: productType as AccountingProductType,
    productName: productName.trim(),
    grossAmount,
    netAmount,
    taxRate,
    taxAmount,
    currency,
    paymentStatus:
      paymentStatus &&
      POSITION_STATUSES.includes(
        paymentStatus as AccountingPositionPaymentStatus,
      )
        ? (paymentStatus as AccountingPositionPaymentStatus)
        : "pending",
    dueDate: readNullableString(body, "dueDate"),
    paidAt: readNullableString(body, "paidAt"),
    note: readNullableString(body, "note"),
  };
}

/**
 * Parst Statusänderung einer Buchhaltungsposition.
 */
export function parseUpdatePositionStatusBody(
  body: Record<string, unknown>,
): UpdateAccountingPositionStatusInput | null {
  const paymentStatus = readString(body, "paymentStatus");

  if (
    !paymentStatus ||
    !POSITION_STATUSES.includes(
      paymentStatus as AccountingPositionPaymentStatus,
    )
  ) {
    return null;
  }

  return {
    paymentStatus: paymentStatus as AccountingPositionPaymentStatus,
    paidAt: readNullableString(body, "paidAt"),
    note: readNullableString(body, "note"),
  };
}

/**
 * Parst eine Shortcut-Aktion (mark_paid, mark_pending, …).
 */
export function parsePositionActionBody(
  body: Record<string, unknown>,
): UpdateAccountingPositionStatusInput | null {
  const action = readString(body, "action");

  if (!action) {
    return parseUpdatePositionStatusBody(body);
  }

  const note = readNullableString(body, "note");

  switch (action) {
    case "mark_paid":
      return {
        paymentStatus: "paid",
        paidAt: new Date().toISOString(),
        note,
      };
    case "mark_pending":
      return {
        paymentStatus: "pending",
        paidAt: null,
        note,
      };
    case "mark_overdue":
      return {
        paymentStatus: "overdue",
        paidAt: null,
        note,
      };
    case "mark_cancelled":
      return {
        paymentStatus: "cancelled",
        paidAt: null,
        note,
      };
    default:
      return null;
  }
}
