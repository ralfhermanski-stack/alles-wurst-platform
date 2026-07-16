/**
 * @file member-count-service.ts
 * @purpose Öffentliche Mitgliederzahl und -liste aus echten Benutzerdaten.
 */

import type { MemberCountDisplayMode, Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { getPublicUserName } from "@/lib/users/public-user";

/** Alle aktiven Konten mit abgeschlossener Registrierung (Passwort gesetzt). */
export const REGISTERED_PUBLIC_MEMBER_WHERE: Prisma.UserWhereInput = {
  deletedAt: null,
  accountStatus: "active",
  passwordHash: { not: null },
};

export type PublicMemberCard = {
  id: string;
  displayName: string;
  profile: {
    publicName: string | null;
    firstName: string | null;
    avatarUrl: string | null;
  };
};

export async function countPublicMembers(): Promise<number> {
  return prisma.user.count({
    where: REGISTERED_PUBLIC_MEMBER_WHERE,
  });
}

export async function listPublicMembersForHomepage(
  limit = 120,
): Promise<PublicMemberCard[]> {
  const users = await prisma.user.findMany({
    where: REGISTERED_PUBLIC_MEMBER_WHERE,
    orderBy: { createdAt: "asc" },
    take: limit,
    select: {
      id: true,
      profile: {
        select: {
          publicName: true,
          firstName: true,
          avatarUrl: true,
        },
      },
    },
  });

  return users.map((user) => ({
    id: user.id,
    displayName: getPublicUserName(user),
    profile: {
      publicName: user.profile?.publicName ?? null,
      firstName: user.profile?.firstName ?? null,
      avatarUrl: user.profile?.avatarUrl ?? null,
    },
  }));
}

export function formatPublicMemberCount(
  count: number,
  mode: MemberCountDisplayMode,
): number | null {
  if (mode === "hidden") {
    return null;
  }

  if (mode === "rounded") {
    if (count < 10) {
      return count;
    }

    if (count < 100) {
      return Math.floor(count / 10) * 10;
    }

    if (count < 1000) {
      return Math.floor(count / 50) * 50;
    }

    return Math.floor(count / 100) * 100;
  }

  return count;
}
