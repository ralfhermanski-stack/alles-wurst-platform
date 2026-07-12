/**
 * @file system-role.ts
 * @purpose Systemrollen — getrennt von Mitgliedschaftslevel.
 */

import type { UserSystemRole } from "@prisma/client";

export type { UserSystemRole };

export const USER_SYSTEM_ROLE_LABELS: Record<UserSystemRole, string> = {
  USER: "Nutzer",
  ADMIN: "Administrator",
  SUPPORT: "Support",
  INSTRUCTOR: "Dozent",
  SUPERADMIN: "Superadministrator",
};

export const USER_SYSTEM_ROLE_OPTIONS: UserSystemRole[] = [
  "USER",
  "SUPPORT",
  "INSTRUCTOR",
  "ADMIN",
  "SUPERADMIN",
];

export function isAdminSystemRole(
  role: UserSystemRole | string | null | undefined,
): boolean {
  return role === "ADMIN" || role === "SUPERADMIN";
}

export function isSuperAdminSystemRole(
  role: UserSystemRole | string | null | undefined,
): boolean {
  return role === "SUPERADMIN";
}
