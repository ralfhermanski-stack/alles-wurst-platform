/**
 * @file admin-audit.ts
 * @purpose Audit-Log für Admin-Aktionen an Nutzern.
 */

import type { MembershipAuditAction } from "@prisma/client";

import { createAccountingAuditLog } from "@/lib/accounting/accounting-audit";
import { listMembershipAuditLogs } from "@/lib/accounting/accounting-audit";

export type AdminAuditEntry = {
  id: string;
  action: MembershipAuditAction;
  actionLabel: string;
  summary: string;
  actorUserId: string;
  note: string | null;
  previousValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  createdAt: string;
};

export type CreateAdminAuditInput = {
  targetUserId: string;
  actorUserId: string;
  action: MembershipAuditAction;
  summary: string;
  previousValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
  note?: string | null;
};

export async function createAdminAuditLog(
  input: CreateAdminAuditInput,
): Promise<void> {
  await createAccountingAuditLog({
    targetUserId: input.targetUserId,
    actorUserId: input.actorUserId,
    actorRole: "admin",
    action: input.action,
    summary: input.summary,
    previousValues: input.previousValues,
    newValues: input.newValues,
    note: input.note,
  });
}

export async function listAdminUserAuditLogs(
  targetUserId: string,
  limit = 50,
): Promise<AdminAuditEntry[]> {
  const rows = await listMembershipAuditLogs(targetUserId, limit);

  return rows.map((row) => ({
    id: row.id,
    action: row.action,
    actionLabel: ADMIN_AUDIT_ACTION_LABELS[row.action] ?? row.action,
    summary: row.summary,
    actorUserId: row.actorUserId,
    note: row.note,
    previousValues:
      row.previousValues && typeof row.previousValues === "object"
        ? (row.previousValues as Record<string, unknown>)
        : null,
    newValues:
      row.newValues && typeof row.newValues === "object"
        ? (row.newValues as Record<string, unknown>)
        : null,
    createdAt: row.createdAt.toISOString(),
  }));
}

export const ADMIN_AUDIT_ACTION_LABELS: Partial<
  Record<MembershipAuditAction, string>
> = {
  user_suspend: "Konto gesperrt",
  user_activate: "Konto aktiviert",
  user_deactivate: "Konto deaktiviert",
  system_role_change: "Systemrolle geändert",
  course_access_grant: "Kurs freigeschaltet",
  course_access_revoke: "Kurszugang entzogen",
  role_change: "Mitgliedschaftsrolle geändert",
  membership_end: "Mitgliedschaft beendet",
  membership_reactivate: "Mitgliedschaft reaktiviert",
};
