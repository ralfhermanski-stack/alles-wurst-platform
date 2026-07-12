/**
 * @file accounting-audit.ts
 * @purpose Audit-Log für Buchhaltungsänderungen an Mitgliedschaften.
 */

import type {
  MembershipAuditAction,
  MembershipRole,
  Prisma,
} from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

import type { MembershipSnapshot } from "./accounting-types";

export type CreateAuditLogInput = {
  targetUserId: string;
  actorUserId: string;
  actorRole: MembershipRole;
  action: MembershipAuditAction;
  summary: string;
  previousValues?: MembershipSnapshot | Record<string, unknown> | null;
  newValues?: MembershipSnapshot | Record<string, unknown> | null;
  note?: string | null;
};

function valuesToJson(
  values: MembershipSnapshot | Record<string, unknown> | null | undefined,
): Prisma.InputJsonValue | undefined {
  if (!values) {
    return undefined;
  }

  if ("role" in values && "status" in values) {
    const snapshot = values as MembershipSnapshot;

    return {
      role: snapshot.role,
      status: snapshot.status,
      paymentStatus: snapshot.paymentStatus,
      paymentNote: snapshot.paymentNote,
      accountingNote: snapshot.accountingNote,
      accessBlocked: snapshot.accessBlocked,
      blockReason: snapshot.blockReason,
      startedAt: snapshot.startedAt?.toISOString() ?? null,
      endsAt: snapshot.endsAt?.toISOString() ?? null,
      extendedUntil: snapshot.extendedUntil?.toISOString() ?? null,
    };
  }

  return values as Prisma.InputJsonValue;
}

/**
 * Schreibt einen Audit-Eintrag für eine Buchhaltungsaktion.
 */
export async function createAccountingAuditLog(
  input: CreateAuditLogInput,
): Promise<void> {
  await prisma.membershipAuditLog.create({
    data: {
      targetUserId: input.targetUserId,
      actorUserId: input.actorUserId,
      actorRole: input.actorRole,
      action: input.action,
      summary: input.summary,
      previousValues: valuesToJson(input.previousValues),
      newValues: valuesToJson(input.newValues),
      note: input.note?.trim() || null,
    },
  });
}

/** @deprecated Alias — nutzt createAccountingAuditLog */
export async function createMembershipAuditLog(
  input: CreateAuditLogInput,
): Promise<void> {
  return createAccountingAuditLog(input);
}

/**
 * Lädt den Audit-Verlauf für einen Nutzer.
 */
export async function listMembershipAuditLogs(
  targetUserId: string,
  limit = 50,
) {
  return prisma.membershipAuditLog.findMany({
    where: { targetUserId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export const AUDIT_ACTION_LABELS: Record<MembershipAuditAction, string> = {
  membership_pause: "Mitgliedschaft pausiert",
  membership_reactivate: "Mitgliedschaft reaktiviert",
  membership_extend: "Mitgliedschaft verlängert",
  membership_end: "Mitgliedschaft beendet",
  membership_block: "Zugriff gesperrt",
  membership_unlock: "Zugriff freigegeben",
  payment_status_change: "Zahlungsstatus geändert",
  role_change: "Rolle geändert",
  payment_note: "Zahlungsnotiz gespeichert",
  accounting_note: "Buchhaltungsvermerk gespeichert",
  manual_update: "Manuelle Korrektur",
  position_create: "Buchhaltungsposition angelegt",
  position_update: "Buchhaltungsposition geändert",
  position_status_change: "Zahlungsstatus der Position geändert",
  checkout_create: "Checkout-Intent erstellt",
  payment_intent_create: "Zahlungsversuch erstellt",
  payment_fulfillment: "Zahlung erfüllt (Mitgliedschaft/Kurs)",
  invoice_create: "Rechnung erzeugt",
  invoice_cancel: "Rechnung storniert",
  credit_note_create: "Gutschrift erstellt",
  user_suspend: "Konto gesperrt",
  user_activate: "Konto aktiviert",
  user_deactivate: "Konto deaktiviert",
  system_role_change: "Systemrolle geändert",
  course_access_grant: "Kurs freigeschaltet",
  course_access_revoke: "Kurszugang entzogen",
};
