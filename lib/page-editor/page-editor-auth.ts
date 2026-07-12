/**
 * @file page-editor-auth.ts
 */

import type { UserSystemRole } from "@prisma/client";

import { hasAdminPermission } from "@/lib/admin/admin-permissions";
import { isAdminSystemRole } from "@/lib/users/system-role";

export function canManagePageContent(role: UserSystemRole): boolean {
  return (
    isAdminSystemRole(role) &&
    hasAdminPermission(role, "content.manage")
  );
}

/** Seiteneditor und Inhalte-APIs: content.manage oder Textverwaltung (settings.write). */
export function canAccessContentAdmin(role: UserSystemRole): boolean {
  return (
    isAdminSystemRole(role) &&
    (hasAdminPermission(role, "content.manage") ||
      hasAdminPermission(role, "settings.write"))
  );
}
