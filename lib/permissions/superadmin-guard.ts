/**
 * @file superadmin-guard.ts
 * @purpose Schutz des letzten Superadministrators und Rechtevergabe-Regeln.
 */

import type { UserSystemRole } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

import { canGrantPermission, isSuperAdmin } from "./permission-service";

export async function countActiveSuperAdmins(): Promise<number> {
  return prisma.user.count({
    where: {
      systemRole: "SUPERADMIN",
      deletedAt: null,
      accountStatus: "active",
    },
  });
}

export async function assertCanChangeUserSystemRole(input: {
  actorUserId: string;
  targetUserId: string;
  newRole: UserSystemRole;
}): Promise<void> {
  const target = await prisma.user.findUnique({
    where: { id: input.targetUserId },
    select: { systemRole: true },
  });

  if (!target) {
    throw new Error("Benutzer nicht gefunden.");
  }

  const actorIsSuperAdmin = await isSuperAdmin(input.actorUserId);

  if (!actorIsSuperAdmin) {
    if (input.newRole === "SUPERADMIN" || input.newRole === "ADMIN") {
      throw new Error("Nur Superadministratoren dürfen Administratorrollen vergeben.");
    }

    const canManageUsers = await canGrantPermission(input.actorUserId, "admin.users.manage");

    if (!canManageUsers) {
      throw new Error("Keine Berechtigung zur Rollenänderung.");
    }
  }

  if (target.systemRole === "SUPERADMIN" && input.newRole !== "SUPERADMIN") {
    const count = await countActiveSuperAdmins();

    if (count <= 1) {
      throw new Error(
        "Der letzte aktive Superadministrator darf nicht herabgestuft werden.",
      );
    }
  }
}

export async function assertCanRemoveFromSuperAdminGroup(
  actorUserId: string,
  targetUserId: string,
): Promise<void> {
  const target = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { systemRole: true },
  });

  if (target?.systemRole === "SUPERADMIN") {
    const count = await countActiveSuperAdmins();

    if (count <= 1) {
      throw new Error(
        "Der letzte aktive Superadministrator darf nicht aus der Superadmin-Gruppe entfernt werden.",
      );
    }
  }

  if (!(await isSuperAdmin(actorUserId))) {
    throw new Error("Nur Superadministratoren dürfen Superadmin-Zuordnungen ändern.");
  }
}

export async function assertCanGrantPermissions(
  actorUserId: string,
  permissionKeys: string[],
): Promise<void> {
  if (await isSuperAdmin(actorUserId)) {
    return;
  }

  for (const key of permissionKeys) {
    const allowed = await canGrantPermission(actorUserId, key);

    if (!allowed) {
      throw new Error(
        `Sie dürfen keine höheren Berechtigungen vergeben als Sie selbst besitzen (${key}).`,
      );
    }
  }
}
