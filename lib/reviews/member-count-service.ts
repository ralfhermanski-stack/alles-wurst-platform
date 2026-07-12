/**
 * @file member-count-service.ts
 * @purpose Öffentliche Mitgliederzahl aus echten Benutzerdaten.
 */

import type { MemberCountDisplayMode } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

export async function countPublicMembers(): Promise<number> {
  return prisma.user.count({
    where: {
      deletedAt: null,
      accountStatus: "active",
      systemRole: "USER",
      passwordHash: { not: null },
    },
  });
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
