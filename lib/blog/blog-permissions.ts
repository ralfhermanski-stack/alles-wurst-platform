/**
 * @file blog-permissions.ts
 * @purpose Rechte für Blog/Magazin-Admin.
 */

import type { UserSystemRole } from "@prisma/client";

import { hasAdminPermission } from "@/lib/admin/admin-permissions";

export function canAccessBlogAdmin(role: UserSystemRole): boolean {
  return (
    hasAdminPermission(role, "blog.read") ||
    hasAdminPermission(role, "blog.write") ||
    hasAdminPermission(role, "blog.publish")
  );
}

export function canReadBlogAdmin(role: UserSystemRole): boolean {
  return hasAdminPermission(role, "blog.read");
}

export function canWriteBlogPost(
  role: UserSystemRole,
  authorUserId: string,
  currentUserId: string,
): boolean {
  if (hasAdminPermission(role, "blog.publish")) {
    return true;
  }

  if (!hasAdminPermission(role, "blog.write")) {
    return false;
  }

  return authorUserId === currentUserId;
}

export function canPublishBlogPost(role: UserSystemRole): boolean {
  return hasAdminPermission(role, "blog.publish");
}

export function canManageBlogTaxonomy(role: UserSystemRole): boolean {
  return hasAdminPermission(role, "blog.publish");
}
