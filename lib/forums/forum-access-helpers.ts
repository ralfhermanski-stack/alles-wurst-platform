/**
 * @file forum-access-helpers.ts
 * @purpose Hilfsfunktionen für Kurs- und Minikurs-Zugriff in Foren.
 */

import { prisma } from "@/lib/db/prisma";

export async function hasAnyMiniCourseAccess(userId: string): Promise<boolean> {
  const now = new Date();
  const access = await prisma.userCourseAccess.findFirst({
    where: {
      userId,
      status: "active",
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      course: { courseType: "minikurs" },
    },
    select: { id: true },
  });

  return Boolean(access);
}
