/**
 * @file help-membership.ts
 * @purpose Mitgliedschaftsprüfungen für Hilfe-Center.
 */

import type { MembershipRole } from "@/lib/membership/membership-rules";
import { resolveMembershipAccessFromDb } from "@/lib/users/membership-service";

export async function getUserMembershipRole(
  userId: string | null | undefined,
): Promise<MembershipRole> {
  if (!userId) {
    return "guest";
  }

  const result = await resolveMembershipAccessFromDb(userId);

  if (!result.success) {
    return "registered";
  }

  return result.data.role;
}

export function hasMeisterclubAccess(role: MembershipRole): boolean {
  return role === "meisterclub" || role === "admin";
}

export function canAccessSupportTickets(role: MembershipRole): boolean {
  return role !== "guest";
}
