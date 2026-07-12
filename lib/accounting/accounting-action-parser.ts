/**
 * @file accounting-action-parser.ts
 * @purpose Parst Buchhaltungsaktionen aus API-Bodies.
 */

import type { MembershipRole, PaymentStatus } from "@prisma/client";

import type { AccountingMembershipAction } from "./accounting-types";

const PAYMENT_STATUSES: PaymentStatus[] = [
  "none",
  "pending",
  "paid",
  "failed",
  "overdue",
  "refunded",
];

const MEMBERSHIP_ROLES: MembershipRole[] = [
  "guest",
  "registered",
  "wurstclub",
  "meisterclub",
  "accounting",
  "admin",
];

function readString(
  body: Record<string, unknown>,
  key: string,
): string | undefined {
  const value = body[key];

  return typeof value === "string" ? value : undefined;
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
 * Parst eine Buchhaltungsaktion aus dem Request-Body.
 */
export function parseAccountingAction(
  body: Record<string, unknown>,
): AccountingMembershipAction | null {
  const type = readString(body, "type");

  if (!type) {
    return null;
  }

  const note = readNullableString(body, "note");

  switch (type) {
    case "pause":
      return { type: "pause", note };

    case "reactivate":
      return {
        type: "reactivate",
        extendedUntil: readString(body, "extendedUntil") ?? null,
        note,
      };

    case "extend": {
      const extendedUntil = readString(body, "extendedUntil");

      if (!extendedUntil) {
        return null;
      }

      return { type: "extend", extendedUntil, note };
    }

    case "end":
      return {
        type: "end",
        note,
        blockReason: readNullableString(body, "blockReason"),
      };

    case "block": {
      const blockReason = readString(body, "blockReason");

      if (!blockReason) {
        return null;
      }

      return { type: "block", blockReason, note };
    }

    case "unlock":
      return { type: "unlock", note };

    case "set_payment_status": {
      const paymentStatus = readString(body, "paymentStatus");

      if (
        !paymentStatus ||
        !PAYMENT_STATUSES.includes(paymentStatus as PaymentStatus)
      ) {
        return null;
      }

      return {
        type: "set_payment_status",
        paymentStatus: paymentStatus as PaymentStatus,
        note,
      };
    }

    case "set_payment_note": {
      const paymentNote = readString(body, "paymentNote");

      if (!paymentNote) {
        return null;
      }

      return { type: "set_payment_note", paymentNote };
    }

    case "set_accounting_note": {
      const accountingNote = readString(body, "accountingNote");

      if (!accountingNote) {
        return null;
      }

      return { type: "set_accounting_note", accountingNote };
    }

    case "set_role": {
      const role = readString(body, "role");

      if (!role || !MEMBERSHIP_ROLES.includes(role as MembershipRole)) {
        return null;
      }

      return {
        type: "set_role",
        role: role as MembershipRole,
        note,
      };
    }

    default:
      return null;
  }
}
