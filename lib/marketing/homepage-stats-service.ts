/**
 * @file homepage-stats-service.ts
 * @purpose Live-Kennzahlen für den Hero-Bereich der Startseite.
 */

import { prisma } from "@/lib/db/prisma";
import { countPublicMembers } from "@/lib/reviews/member-count-service";
import { tools } from "@/lib/placeholder-data";

export type HomepageHeroStats = {
  catalogLessonCount: number;
  activeMemberCount: number;
  workshopToolCount: number;
};

export function formatHomepageHeroStatValue(count: number): string {
  return count.toLocaleString("de-DE");
}

async function countCatalogLessons(): Promise<number> {
  return prisma.courseLesson.count({
    where: {
      lessonType: { not: "certificate" },
      module: {
        course: { status: "published" },
      },
    },
  });
}

export async function getHomepageHeroStats(): Promise<HomepageHeroStats> {
  const [catalogLessonCount, activeMemberCount] = await Promise.all([
    countCatalogLessons(),
    countPublicMembers(),
  ]);

  return {
    catalogLessonCount,
    activeMemberCount,
    workshopToolCount: tools.length,
  };
}
