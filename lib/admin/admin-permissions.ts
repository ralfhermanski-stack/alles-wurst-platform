/**
 * @file admin-permissions.ts
 * @purpose Zentrale Rechte-Matrix für Systemrollen (pragmatisch, enum-basiert).
 *          Ergänzt durch granulares DB-Berechtigungssystem in lib/permissions/.
 */

import type { UserSystemRole } from "@prisma/client";

import { LEGACY_ADMIN_PERMISSION_MAP } from "@/lib/permissions/permission-catalog";
import { hasPermission as hasUserPermission } from "@/lib/permissions/permission-service";

export type AdminPermission =
  | "users.read"
  | "users.write"
  | "users.suspend"
  | "users.delete"
  | "courses.read"
  | "courses.write"
  | "memberships.write"
  | "orders.read"
  | "certificates.write"
  | "reviews.moderate"
  | "forums.moderate"
  | "tickets.read"
  | "tickets.write"
  | "tickets.assign"
  | "tickets.admin"
  | "blog.read"
  | "blog.write"
  | "blog.publish"
  | "settings.write"
  | "content.manage"
  | "legal.manage"
  | "privacy.manage"
  | "maintenance.bypass"
  | "email.view"
  | "email.manage"
  | "email.send"
  | "email.templates.manage"
  | "email.providers.manage"
  | "email.logs.view"
  | "email.retry"
  | "email.attachments.send"
  | "email.send.external"
  | "email.bulk.send";

const ROLE_PERMISSIONS: Record<UserSystemRole, AdminPermission[]> = {
  USER: [],
  SUPPORT: [
    "users.read",
    "users.suspend",
    "courses.read",
    "orders.read",
    "reviews.moderate",
    "forums.moderate",
    "tickets.read",
    "tickets.write",
    "tickets.assign",
    "email.view",
    "email.send",
    "email.logs.view",
  ],
  INSTRUCTOR: [
    "users.read",
    "courses.read",
    "courses.write",
    "certificates.write",
    "blog.read",
    "blog.write",
  ],
  ADMIN: [
    "users.read",
    "users.write",
    "users.suspend",
    "users.delete",
    "courses.read",
    "courses.write",
    "memberships.write",
    "orders.read",
    "certificates.write",
    "reviews.moderate",
    "forums.moderate",
    "tickets.read",
    "tickets.write",
    "tickets.assign",
    "tickets.admin",
    "blog.read",
    "blog.write",
    "blog.publish",
    "settings.write",
    "content.manage",
    "legal.manage",
    "privacy.manage",
    "maintenance.bypass",
    "email.view",
    "email.manage",
    "email.send",
    "email.templates.manage",
    "email.providers.manage",
    "email.logs.view",
    "email.retry",
    "email.attachments.send",
    "email.send.external",
    "email.bulk.send",
  ],
  SUPERADMIN: [
    "users.read",
    "users.write",
    "users.suspend",
    "users.delete",
    "courses.read",
    "courses.write",
    "memberships.write",
    "orders.read",
    "certificates.write",
    "reviews.moderate",
    "forums.moderate",
    "tickets.read",
    "tickets.write",
    "tickets.assign",
    "tickets.admin",
    "blog.read",
    "blog.write",
    "blog.publish",
    "settings.write",
    "content.manage",
    "legal.manage",
    "privacy.manage",
    "maintenance.bypass",
    "email.view",
    "email.manage",
    "email.send",
    "email.templates.manage",
    "email.providers.manage",
    "email.logs.view",
    "email.retry",
    "email.attachments.send",
    "email.send.external",
    "email.bulk.send",
  ],
};

export function hasAdminPermission(
  role: UserSystemRole,
  permission: AdminPermission,
): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export async function hasAdminPermissionForUser(
  userId: string,
  permission: AdminPermission,
): Promise<boolean> {
  const mapped = LEGACY_ADMIN_PERMISSION_MAP[permission];

  if (mapped && (await hasUserPermission(userId, mapped))) {
    return true;
  }

  const user = await import("@/lib/db/prisma").then((m) =>
    m.prisma.user.findUnique({
      where: { id: userId },
      select: { systemRole: true },
    }),
  );

  if (!user) {
    return false;
  }

  return hasAdminPermission(user.systemRole, permission);
}

export function canManageUsers(role: UserSystemRole): boolean {
  return hasAdminPermission(role, "users.write");
}
