/**
 * @file support-permissions.ts
 * @purpose Rechteprüfung für Support-Tickets.
 */

import type { SupportTicket, UserSystemRole } from "@prisma/client";

import { hasAdminPermission } from "@/lib/admin/admin-permissions";
import { isAdminSystemRole } from "@/lib/users/system-role";

export function isSupportStaffRole(
  role: UserSystemRole | null | undefined,
): boolean {
  return role === "ADMIN" || role === "SUPPORT";
}

export function canAccessSupportAdmin(
  role: UserSystemRole | null | undefined,
): boolean {
  if (!role) {
    return false;
  }

  if (isAdminSystemRole(role)) {
    return true;
  }

  return hasAdminPermission(role, "tickets.read");
}

export function canManageAllTickets(
  role: UserSystemRole | null | undefined,
): boolean {
  if (!role) {
    return false;
  }

  if (isAdminSystemRole(role)) {
    return true;
  }

  return hasAdminPermission(role, "tickets.admin");
}

export function canAssignTickets(
  role: UserSystemRole | null | undefined,
): boolean {
  if (!role) {
    return false;
  }

  if (isAdminSystemRole(role)) {
    return true;
  }

  return hasAdminPermission(role, "tickets.assign");
}

export function canReadTicketAsStaff(
  role: UserSystemRole | null | undefined,
  staffUserId: string,
  ticket: Pick<SupportTicket, "assignedToUserId" | "userId">,
): boolean {
  if (!canAccessSupportAdmin(role)) {
    return false;
  }

  if (canManageAllTickets(role)) {
    return true;
  }

  return ticket.assignedToUserId === staffUserId;
}

export function canReadTicketAsUser(
  userId: string,
  ticket: Pick<SupportTicket, "userId" | "anonymizedAt">,
): boolean {
  if (ticket.anonymizedAt) {
    return false;
  }

  return ticket.userId === userId;
}

export function canWriteTicketAsUser(
  ticket: Pick<SupportTicket, "status" | "userId" | "anonymizedAt">,
  userId: string,
): boolean {
  if (!canReadTicketAsUser(userId, ticket)) {
    return false;
  }

  return ticket.status !== "closed";
}

export function canWriteTicketAsStaff(
  role: UserSystemRole | null | undefined,
  staffUserId: string,
  ticket: Pick<SupportTicket, "assignedToUserId" | "status" | "userId">,
): boolean {
  if (!canReadTicketAsStaff(role, staffUserId, ticket)) {
    return false;
  }

  return ticket.status !== "closed";
}
