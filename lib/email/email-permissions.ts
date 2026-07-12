/**
 * @file email-permissions.ts
 */

import type { EmailCategory } from "@prisma/client";
import type { UserSystemRole } from "@prisma/client";

import { hasAdminPermission, type AdminPermission } from "@/lib/admin/admin-permissions";

export type EmailPermission =
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

const EMAIL_ROLE_PERMISSIONS: Record<UserSystemRole, EmailPermission[]> = {
  USER: [],
  SUPPORT: ["email.view", "email.send", "email.logs.view"],
  INSTRUCTOR: [],
  ADMIN: [
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

const SUPPORT_SEND_CATEGORIES: EmailCategory[] = [
  "SUPPORT",
  "TICKET",
  "MASTER_SUPPORT",
];

const BILLING_SEND_CATEGORIES: EmailCategory[] = [
  "ORDER",
  "PAYMENT",
  "BILLING",
];

export function hasEmailPermission(
  role: UserSystemRole,
  permission: EmailPermission,
): boolean {
  if (role === "ADMIN" || role === "SUPERADMIN") {
    return true;
  }

  return EMAIL_ROLE_PERMISSIONS[role].includes(permission);
}

export function canSendEmailCategory(
  role: UserSystemRole,
  category: EmailCategory,
): boolean {
  if (!hasEmailPermission(role, "email.send")) {
    return false;
  }

  if (role === "ADMIN" || role === "SUPERADMIN") {
    return true;
  }

  if (role === "SUPPORT") {
    return SUPPORT_SEND_CATEGORIES.includes(category);
  }

  return false;
}

export function canSendBillingEmail(role: UserSystemRole): boolean {
  return (
    role === "ADMIN" ||
    role === "SUPERADMIN" ||
    BILLING_SEND_CATEGORIES.some((category) => canSendEmailCategory(role, category))
  );
}

export function assertStaffMaySendEmail(role: UserSystemRole): boolean {
  return hasEmailPermission(role, "email.send");
}

export function mapLegacyAdminPermission(
  permission: AdminPermission,
): EmailPermission | null {
  if (permission === "content.manage") {
    return "email.templates.manage";
  }

  if (permission === "settings.write") {
    return "email.providers.manage";
  }

  return null;
}
