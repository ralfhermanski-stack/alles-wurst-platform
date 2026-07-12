/**
 * @file permission-audit.ts
 * @purpose Audit-Protokoll für Gruppen- und Berechtigungsänderungen.
 */

import type { PermissionAuditAction } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

export const PERMISSION_AUDIT_ACTION_LABELS: Record<PermissionAuditAction, string> = {
  group_created: "Gruppe erstellt",
  group_updated: "Gruppe geändert",
  group_deleted: "Gruppe gelöscht",
  group_duplicated: "Gruppe dupliziert",
  group_archived: "Gruppe archiviert",
  group_deactivated: "Gruppe deaktiviert",
  group_member_added: "Benutzer zur Gruppe hinzugefügt",
  group_member_removed: "Benutzer aus Gruppe entfernt",
  group_permission_allowed: "Gruppenberechtigung erlaubt",
  group_permission_denied: "Gruppenberechtigung verweigert",
  group_permission_removed: "Gruppenberechtigung entfernt",
  user_permission_allowed: "Individuelle Erlaubnis vergeben",
  user_permission_denied: "Individuelles Verbot gesetzt",
  user_permission_removed: "Individuelle Berechtigung entfernt",
  admin_right_granted: "Adminrecht vergeben",
  admin_right_revoked: "Adminrecht entzogen",
  superadmin_change_attempt: "Superadmin-Änderungsversuch",
  unauthorized_access: "Unberechtigter Zugriff",
  membership_group_sync: "Mitgliedschaftsgruppe synchronisiert",
};

export async function writePermissionAuditLog(input: {
  action: PermissionAuditAction;
  actorUserId?: string | null;
  targetUserId?: string | null;
  targetGroupId?: string | null;
  targetGroupName?: string | null;
  permissionKey?: string | null;
  previousValues?: unknown;
  newValues?: unknown;
  summary: string;
  note?: string | null;
  ipAddress?: string | null;
}) {
  return prisma.permissionAuditLog.create({
    data: {
      action: input.action,
      actorUserId: input.actorUserId ?? null,
      targetUserId: input.targetUserId ?? null,
      targetGroupId: input.targetGroupId ?? null,
      targetGroupName: input.targetGroupName ?? null,
      permissionKey: input.permissionKey ?? null,
      previousValues: input.previousValues as object | undefined,
      newValues: input.newValues as object | undefined,
      summary: input.summary,
      note: input.note ?? null,
      ipAddress: input.ipAddress ?? null,
    },
  });
}

export async function listPermissionAuditLogs(options?: {
  limit?: number;
  targetUserId?: string;
  targetGroupId?: string;
}) {
  const rows = await prisma.permissionAuditLog.findMany({
    where: {
      targetUserId: options?.targetUserId,
      targetGroupId: options?.targetGroupId,
    },
    orderBy: { createdAt: "desc" },
    take: options?.limit ?? 100,
  });

  return rows.map((row) => ({
    id: row.id,
    action: row.action,
    actionLabel: PERMISSION_AUDIT_ACTION_LABELS[row.action],
    actorUserId: row.actorUserId,
    targetUserId: row.targetUserId,
    targetGroupId: row.targetGroupId,
    targetGroupName: row.targetGroupName,
    permissionKey: row.permissionKey,
    summary: row.summary,
    note: row.note,
    ipAddress: row.ipAddress,
    previousValues: row.previousValues,
    newValues: row.newValues,
    createdAt: row.createdAt.toISOString(),
  }));
}
