/**
 * @file group-service.ts
 * @purpose CRUD für Benutzergruppen und Berechtigungsmatrix.
 */

import type { MembershipRole, PermissionEffect, UserGroupStatus, UserSystemRole } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

import { writePermissionAuditLog } from "./permission-audit";
import { isKnownPermissionKey, PERMISSION_CATALOG } from "./permission-catalog";
import {
  assertCanGrantPermissions,
  assertCanRemoveFromSuperAdminGroup,
} from "./superadmin-guard";
import type { UserGroupDetail, UserGroupSummary } from "./permission-types";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function mapGroupSummary(
  row: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    internalNote: string | null;
    color: string | null;
    priority: number;
    isSystem: boolean;
    status: UserGroupStatus;
    linkedMembershipRole: MembershipRole | null;
    linkedSystemRole: UserSystemRole | null;
    createdAt: Date;
    updatedAt: Date;
    _count?: { members: number; permissions: number };
  },
): UserGroupSummary {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    internalNote: row.internalNote,
    color: row.color,
    priority: row.priority,
    isSystem: row.isSystem,
    status: row.status,
    linkedMembershipRole: row.linkedMembershipRole,
    linkedSystemRole: row.linkedSystemRole,
    memberCount: row._count?.members ?? 0,
    permissionCount: row._count?.permissions ?? 0,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listUserGroups(): Promise<UserGroupSummary[]> {
  const rows = await prisma.userGroup.findMany({
    orderBy: [{ priority: "desc" }, { name: "asc" }],
    include: {
      _count: {
        select: { members: true, permissions: true },
      },
    },
  });

  return rows.map(mapGroupSummary);
}

export async function getUserGroupDetail(groupId: string): Promise<UserGroupDetail | null> {
  const row = await prisma.userGroup.findUnique({
    where: { id: groupId },
    include: {
      permissions: {
        include: { permission: true },
        orderBy: { permission: { sortOrder: "asc" } },
      },
      _count: {
        select: { members: true, permissions: true },
      },
    },
  });

  if (!row) {
    return null;
  }

  return {
    ...mapGroupSummary(row),
    permissions: row.permissions.map((entry) => ({
      permissionId: entry.permissionId,
      key: entry.permission.key,
      name: entry.permission.name,
      category: entry.permission.category,
      areaKey: entry.permission.areaKey,
      actionKey: entry.permission.actionKey,
      effect: entry.effect,
      isCritical: entry.permission.isCritical,
    })),
  };
}

export async function createUserGroup(
  actorUserId: string,
  input: {
    name: string;
    description?: string;
    internalNote?: string;
    color?: string;
    priority?: number;
    linkedMembershipRole?: MembershipRole | null;
    linkedSystemRole?: UserSystemRole | null;
  },
): Promise<UserGroupSummary> {
  const baseSlug = slugify(input.name);
  let slug = baseSlug;
  let counter = 1;

  while (await prisma.userGroup.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter}`;
    counter += 1;
  }

  const row = await prisma.userGroup.create({
    data: {
      name: input.name.trim(),
      slug,
      description: input.description?.trim() || null,
      internalNote: input.internalNote?.trim() || null,
      color: input.color ?? "#C9A227",
      priority: input.priority ?? 100,
      linkedMembershipRole: input.linkedMembershipRole ?? null,
      linkedSystemRole: input.linkedSystemRole ?? null,
    },
    include: {
      _count: { select: { members: true, permissions: true } },
    },
  });

  await writePermissionAuditLog({
    action: "group_created",
    actorUserId,
    targetGroupId: row.id,
    targetGroupName: row.name,
    summary: `Gruppe „${row.name}" erstellt.`,
    newValues: row,
  });

  return mapGroupSummary(row);
}

export async function updateUserGroup(
  actorUserId: string,
  groupId: string,
  input: Partial<{
    name: string;
    description: string | null;
    internalNote: string | null;
    color: string | null;
    priority: number;
    status: UserGroupStatus;
  }>,
): Promise<UserGroupSummary> {
  const existing = await prisma.userGroup.findUnique({ where: { id: groupId } });

  if (!existing) {
    throw new Error("Gruppe nicht gefunden.");
  }

  const row = await prisma.userGroup.update({
    where: { id: groupId },
    data: {
      name: input.name?.trim(),
      description: input.description,
      internalNote: input.internalNote,
      color: input.color,
      priority: input.priority,
      status: input.status,
      archivedAt: input.status === "archived" ? new Date() : existing.archivedAt,
    },
    include: {
      _count: { select: { members: true, permissions: true } },
    },
  });

  await writePermissionAuditLog({
    action: input.status === "archived"
      ? "group_archived"
      : input.status === "deactivated"
        ? "group_deactivated"
        : "group_updated",
    actorUserId,
    targetGroupId: row.id,
    targetGroupName: row.name,
    summary: `Gruppe „${row.name}" aktualisiert.`,
    previousValues: existing,
    newValues: row,
  });

  return mapGroupSummary(row);
}

export async function duplicateUserGroup(
  actorUserId: string,
  groupId: string,
): Promise<UserGroupSummary> {
  const source = await prisma.userGroup.findUnique({
    where: { id: groupId },
    include: { permissions: true },
  });

  if (!source) {
    throw new Error("Gruppe nicht gefunden.");
  }

  const copy = await createUserGroup(actorUserId, {
    name: `${source.name} (Kopie)`,
    description: source.description ?? undefined,
    internalNote: source.internalNote ?? undefined,
    color: source.color ?? undefined,
    priority: source.priority,
  });

  if (source.permissions.length > 0) {
    await prisma.userGroupPermission.createMany({
      data: source.permissions.map((entry) => ({
        groupId: copy.id,
        permissionId: entry.permissionId,
        effect: entry.effect,
      })),
      skipDuplicates: true,
    });
  }

  await writePermissionAuditLog({
    action: "group_duplicated",
    actorUserId,
    targetGroupId: copy.id,
    targetGroupName: copy.name,
    summary: `Gruppe „${source.name}" dupliziert.`,
    previousValues: { sourceGroupId: source.id },
    newValues: { newGroupId: copy.id },
  });

  return copy;
}

export async function deleteUserGroup(actorUserId: string, groupId: string): Promise<void> {
  const existing = await prisma.userGroup.findUnique({ where: { id: groupId } });

  if (!existing) {
    throw new Error("Gruppe nicht gefunden.");
  }

  if (existing.isSystem) {
    throw new Error("Systemgruppen dürfen nicht gelöscht werden.");
  }

  await prisma.userGroup.delete({ where: { id: groupId } });

  await writePermissionAuditLog({
    action: "group_deleted",
    actorUserId,
    targetGroupId: groupId,
    targetGroupName: existing.name,
    summary: `Gruppe „${existing.name}" gelöscht.`,
    previousValues: existing,
  });
}

export async function setGroupPermissions(
  actorUserId: string,
  groupId: string,
  entries: Array<{ permissionKey: string; effect: PermissionEffect | null }>,
): Promise<UserGroupDetail> {
  const group = await prisma.userGroup.findUnique({ where: { id: groupId } });

  if (!group) {
    throw new Error("Gruppe nicht gefunden.");
  }

  const allowKeys = entries
    .filter((entry) => entry.effect === "ALLOW")
    .map((entry) => entry.permissionKey);

  await assertCanGrantPermissions(actorUserId, allowKeys);

  const permissionRows = await prisma.permission.findMany({
    where: {
      key: {
        in: entries.map((entry) => entry.permissionKey).filter(isKnownPermissionKey),
      },
    },
  });

  const permissionByKey = new Map(permissionRows.map((row) => [row.key, row.id]));

  await prisma.userGroupPermission.deleteMany({ where: { groupId } });

  const toCreate = entries
    .filter((entry) => entry.effect && permissionByKey.has(entry.permissionKey))
    .map((entry) => ({
      groupId,
      permissionId: permissionByKey.get(entry.permissionKey)!,
      effect: entry.effect!,
    }));

  if (toCreate.length > 0) {
    await prisma.userGroupPermission.createMany({ data: toCreate });
  }

  await writePermissionAuditLog({
    action: "group_updated",
    actorUserId,
    targetGroupId: groupId,
    targetGroupName: group.name,
    summary: `Berechtigungsmatrix für „${group.name}" gespeichert.`,
    newValues: entries,
  });

  return (await getUserGroupDetail(groupId))!;
}

export async function addUsersToGroup(
  actorUserId: string,
  groupId: string,
  userIds: string[],
  options?: {
    validFrom?: Date | null;
    validUntil?: Date | null;
    isManual?: boolean;
  },
): Promise<number> {
  const group = await prisma.userGroup.findUnique({ where: { id: groupId } });

  if (!group) {
    throw new Error("Gruppe nicht gefunden.");
  }

  let added = 0;

  for (const userId of userIds) {
    await prisma.userGroupMember.upsert({
      where: { groupId_userId: { groupId, userId } },
      create: {
        groupId,
        userId,
        validFrom: options?.validFrom ?? null,
        validUntil: options?.validUntil ?? null,
        isManual: options?.isManual ?? true,
        assignedByUserId: actorUserId,
      },
      update: {
        validFrom: options?.validFrom ?? null,
        validUntil: options?.validUntil ?? null,
        isManual: options?.isManual ?? true,
        assignedByUserId: actorUserId,
      },
    });

    added += 1;

    await writePermissionAuditLog({
      action: "group_member_added",
      actorUserId,
      targetUserId: userId,
      targetGroupId: groupId,
      targetGroupName: group.name,
      summary: `Benutzer zur Gruppe „${group.name}" hinzugefügt.`,
    });
  }

  return added;
}

export async function removeUserFromGroup(
  actorUserId: string,
  groupId: string,
  userId: string,
): Promise<void> {
  const group = await prisma.userGroup.findUnique({ where: { id: groupId } });

  if (!group) {
    throw new Error("Gruppe nicht gefunden.");
  }

  if (group.slug === "superadministrator") {
    await assertCanRemoveFromSuperAdminGroup(actorUserId, userId);
  }

  await prisma.userGroupMember.deleteMany({
    where: { groupId, userId },
  });

  await writePermissionAuditLog({
    action: "group_member_removed",
    actorUserId,
    targetUserId: userId,
    targetGroupId: groupId,
    targetGroupName: group.name,
    summary: `Benutzer aus Gruppe „${group.name}" entfernt.`,
  });
}

export async function applyStandardPermissionsToGroup(
  groupId: string,
  permissionKeys: string[],
): Promise<void> {
  const permissions = await prisma.permission.findMany({
    where: { key: { in: permissionKeys } },
  });

  await prisma.userGroupPermission.deleteMany({ where: { groupId } });

  if (permissions.length > 0) {
    await prisma.userGroupPermission.createMany({
      data: permissions.map((permission) => ({
        groupId,
        permissionId: permission.id,
        effect: "ALLOW" as PermissionEffect,
      })),
      skipDuplicates: true,
    });
  }
}

export function getCatalogForMatrix() {
  return PERMISSION_CATALOG;
}
