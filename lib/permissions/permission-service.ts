/**
 * @file permission-service.ts
 * @purpose Zentrale serverseitige Berechtigungsprüfung.
 */

import type { MembershipRole, UserSystemRole } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { isLoginAllowed } from "@/lib/users/account-status";

import { isKnownPermissionKey, PERMISSION_CATALOG_BY_KEY } from "./permission-catalog";
import {
  hasAllPermissions,
  hasAnyPermission,
  isPermissionAllowed,
  resolveEffectivePermissions,
  type PermissionGrantInput,
} from "./permission-resolver";
import type {
  EffectivePermissionMap,
  PermissionCheckResult,
  UserRightsOverview,
} from "./permission-types";

type UserPermissionContext = {
  userId: string;
  systemRole: UserSystemRole;
  membershipRole: MembershipRole | null;
  maintenanceBypass: boolean;
};

function isAssignmentActive(validFrom: Date | null, validUntil: Date | null, now = new Date()): boolean {
  if (validFrom && validFrom.getTime() > now.getTime()) {
    return false;
  }

  if (validUntil && validUntil.getTime() < now.getTime()) {
    return false;
  }

  return true;
}

function isActiveMembership(membership: {
  status: string;
  accessBlocked: boolean;
  endsAt: Date | null;
  extendedUntil: Date | null;
} | null): boolean {
  if (!membership || membership.status !== "active" || membership.accessBlocked) {
    return false;
  }

  const end = membership.extendedUntil ?? membership.endsAt;

  if (end && end.getTime() < Date.now()) {
    return false;
  }

  return true;
}

async function loadUserContext(userId: string): Promise<UserPermissionContext | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      systemRole: true,
      maintenanceBypass: true,
      deletedAt: true,
      accountStatus: true,
      membership: {
        select: {
          role: true,
          status: true,
          accessBlocked: true,
          endsAt: true,
          extendedUntil: true,
        },
      },
    },
  });

  if (!user || !isLoginAllowed(user.accountStatus, user.deletedAt)) {
    return null;
  }

  const membershipActive = isActiveMembership(user.membership);

  return {
    userId: user.id,
    systemRole: user.systemRole,
    membershipRole: membershipActive ? user.membership?.role ?? null : null,
    maintenanceBypass: user.maintenanceBypass,
  };
}

function addSystemRoleGrants(
  grants: PermissionGrantInput[],
  systemRole: UserSystemRole,
): void {
  if (systemRole === "SUPERADMIN") {
    for (const entry of PERMISSION_CATALOG_BY_KEY.values()) {
      grants.push({
        permissionKey: entry.key,
        effect: "ALLOW",
        source: "system_role",
        sourceLabel: "Systemrolle: Superadministrator",
        priority: 1000,
      });
    }

    return;
  }

  const roleGroupMap: Partial<Record<UserSystemRole, string>> = {
    ADMIN: "administrator",
    SUPPORT: "support",
    INSTRUCTOR: "kursleiter",
  };

  const slug = roleGroupMap[systemRole];

  if (slug) {
    grants.push({
      permissionKey: "system.role.linked",
      effect: "ALLOW",
      source: "system_role",
      sourceLabel: `Systemrolle: ${systemRole}`,
      priority: 100,
    });
  }
}

export async function collectPermissionGrants(userId: string): Promise<PermissionGrantInput[]> {
  const context = await loadUserContext(userId);

  if (!context) {
    return [];
  }

  const grants: PermissionGrantInput[] = [];
  const now = new Date();

  addSystemRoleGrants(grants, context.systemRole);

  const [groupMembers, userPermissions, groups] = await Promise.all([
    prisma.userGroupMember.findMany({
      where: { userId },
      include: {
        group: {
          include: {
            permissions: {
              include: { permission: true },
            },
          },
        },
      },
    }),
    prisma.userPermission.findMany({
      where: { userId },
      include: { permission: true },
    }),
    prisma.userGroup.findMany({
      where: {
        status: "active",
        OR: [
          context.membershipRole
            ? { linkedMembershipRole: context.membershipRole }
            : undefined,
          { linkedSystemRole: context.systemRole },
        ].filter(Boolean) as Array<{ linkedMembershipRole?: MembershipRole; linkedSystemRole?: UserSystemRole }>,
      },
      include: {
        permissions: {
          include: { permission: true },
        },
      },
    }),
  ]);

  for (const member of groupMembers) {
    if (member.group.status !== "active") {
      continue;
    }

    if (!isAssignmentActive(member.validFrom, member.validUntil, now)) {
      continue;
    }

    for (const groupPermission of member.group.permissions) {
      grants.push({
        permissionKey: groupPermission.permission.key,
        effect: groupPermission.effect,
        source: groupPermission.effect === "DENY" ? "group_deny" : "group_allow",
        sourceLabel: `Gruppe: ${member.group.name}`,
        groupId: member.group.id,
        groupName: member.group.name,
        priority: member.group.priority,
      });
    }
  }

  for (const group of groups) {
    const alreadyMember = groupMembers.some((member) => member.groupId === group.id);

    if (alreadyMember) {
      continue;
    }

    for (const groupPermission of group.permissions) {
      grants.push({
        permissionKey: groupPermission.permission.key,
        effect: groupPermission.effect,
        source: groupPermission.effect === "DENY" ? "group_deny" : "membership",
        sourceLabel: group.linkedMembershipRole
          ? `Mitgliedschaft: ${group.linkedMembershipRole}`
          : `Systemgruppe: ${group.name}`,
        groupId: group.id,
        groupName: group.name,
        priority: group.priority,
      });
    }
  }

  for (const userPermission of userPermissions) {
    if (!isAssignmentActive(userPermission.validFrom, userPermission.validUntil, now)) {
      continue;
    }

    grants.push({
      permissionKey: userPermission.permission.key,
      effect: userPermission.effect,
      source: userPermission.effect === "DENY" ? "user_deny" : "user_allow",
      sourceLabel: "Individuelle Benutzereinstellung",
      priority: 10000,
    });
  }

  if (context.maintenanceBypass) {
    grants.push({
      permissionKey: "system.maintenance.bypass",
      effect: "ALLOW",
      source: "user_allow",
      sourceLabel: "Individuell: Wartungsmodus-Bypass",
      priority: 10000,
    });
  }

  return grants;
}

export async function resolveUserPermissions(userId: string): Promise<EffectivePermissionMap> {
  const grants = await collectPermissionGrants(userId);
  return resolveEffectivePermissions(grants);
}

export async function hasPermission(userId: string, permissionKey: string): Promise<boolean> {
  if (!isKnownPermissionKey(permissionKey)) {
    return false;
  }

  const map = await resolveUserPermissions(userId);
  return isPermissionAllowed(map, permissionKey);
}

export async function hasAnyPermissionForUser(
  userId: string,
  permissionKeys: string[],
): Promise<boolean> {
  const map = await resolveUserPermissions(userId);
  return hasAnyPermission(map, permissionKeys);
}

export async function hasAllPermissionsForUser(
  userId: string,
  permissionKeys: string[],
): Promise<boolean> {
  const map = await resolveUserPermissions(userId);
  return hasAllPermissions(map, permissionKeys);
}

export async function checkPermission(
  userId: string,
  permissionKey: string,
): Promise<PermissionCheckResult> {
  if (!isKnownPermissionKey(permissionKey)) {
    return {
      allowed: false,
      permissionKey,
      source: "none",
      sourceLabel: "Unbekannte Berechtigung",
      reason: "Die angeforderte Berechtigung ist nicht im Katalog definiert.",
    };
  }

  const map = await resolveUserPermissions(userId);
  const resolved = map.get(permissionKey);

  if (!resolved || !resolved.allowed) {
    return {
      allowed: false,
      permissionKey,
      source: resolved?.source ?? "none",
      sourceLabel: resolved?.sourceLabel ?? "Keine Berechtigung",
      reason: resolved
        ? `Verweigert durch: ${resolved.sourceLabel}`
        : "Keine passende Erlaubnis gefunden.",
      deniedBy: resolved?.sourceLabel,
    };
  }

  return {
    allowed: true,
    permissionKey,
    source: resolved.source,
    sourceLabel: resolved.sourceLabel,
    reason: `Erlaubt durch: ${resolved.sourceLabel}`,
    groupName: resolved.groupName,
  };
}

export async function requirePermission(
  userId: string,
  permissionKey: string,
): Promise<void> {
  const allowed = await hasPermission(userId, permissionKey);

  if (!allowed) {
    throw new Error(`Zugriff verweigert: ${permissionKey}`);
  }
}

export async function isSuperAdmin(userId: string): Promise<boolean> {
  const context = await loadUserContext(userId);
  return context?.systemRole === "SUPERADMIN";
}

export async function canGrantPermission(
  grantingUserId: string,
  permissionKey: string,
): Promise<boolean> {
  if (await isSuperAdmin(grantingUserId)) {
    return true;
  }

  return hasPermission(grantingUserId, permissionKey);
}

export async function getUserRightsOverview(userId: string): Promise<UserRightsOverview | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      systemRole: true,
      membership: {
        select: { role: true, status: true },
      },
      userGroupMembers: {
        include: { group: true },
      },
      userPermissions: {
        include: { permission: true },
      },
    },
  });

  if (!user) {
    return null;
  }

  const map = await resolveUserPermissions(userId);
  const now = new Date();

  return {
    systemRole: user.systemRole,
    membershipRole: user.membership?.role ?? null,
    membershipStatus: user.membership?.status ?? null,
    groups: user.userGroupMembers
      .filter((member) => member.group.status === "active")
      .filter((member) => isAssignmentActive(member.validFrom, member.validUntil, now))
      .map((member) => ({
        id: member.group.id,
        name: member.group.name,
        slug: member.group.slug,
        color: member.group.color,
        isManual: member.isManual,
        validFrom: member.validFrom?.toISOString() ?? null,
        validUntil: member.validUntil?.toISOString() ?? null,
      })),
    individualPermissions: user.userPermissions
      .filter((entry) => isAssignmentActive(entry.validFrom, entry.validUntil, now))
      .map((entry) => ({
        id: entry.id,
        permissionId: entry.permissionId,
        key: entry.permission.key,
        name: entry.permission.name,
        effect: entry.effect,
        validFrom: entry.validFrom?.toISOString() ?? null,
        validUntil: entry.validUntil?.toISOString() ?? null,
      })),
    effectivePermissions: [...map.values()].filter((entry) => entry.allowed),
  };
}

export async function canAccessRoute(userId: string, routeKey: string): Promise<boolean> {
  const routePermission = await prisma.routePermission.findUnique({
    where: { routeKey },
    include: { permission: true },
  });

  if (!routePermission) {
    return true;
  }

  return hasPermission(userId, routePermission.permission.key);
}

export function canEditOwnResource(userId: string, resourceUserId: string | null | undefined): boolean {
  return Boolean(resourceUserId && resourceUserId === userId);
}
