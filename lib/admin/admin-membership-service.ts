/**
 * @file admin-membership-service.ts
 * @purpose Mitgliedschaftsübersicht für Administratoren.
 */

import { prisma } from "@/lib/db/prisma";
import { getPublicUserName } from "@/lib/users/public-user";
import { MEMBERSHIP_ROLE_LABELS } from "@/lib/membership/membership-labels";

export type AdminMembershipEntry = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  role: string;
  roleLabel: string;
  status: string;
  paymentStatus: string;
  startedAt: string | null;
  endsAt: string | null;
  extendedUntil: string | null;
};

export async function listAdminMemberships(): Promise<AdminMembershipEntry[]> {
  const memberships = await prisma.membership.findMany({
    include: {
      user: {
        include: { profile: true },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 200,
  });

  return memberships.map((membership) => ({
    id: membership.id,
    userId: membership.userId,
    userName: getPublicUserName({ profile: membership.user.profile }),
    userEmail: membership.user.email,
    role: membership.role,
    roleLabel:
      MEMBERSHIP_ROLE_LABELS[
        membership.role as keyof typeof MEMBERSHIP_ROLE_LABELS
      ] ?? membership.role,
    status: membership.status,
    paymentStatus: membership.paymentStatus,
    startedAt: membership.startedAt?.toISOString() ?? null,
    endsAt: membership.endsAt?.toISOString() ?? null,
    extendedUntil: membership.extendedUntil?.toISOString() ?? null,
  }));
}
