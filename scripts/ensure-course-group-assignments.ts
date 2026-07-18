/**
 * @file ensure-course-group-assignments.ts
 * @purpose Bestehende Kurse retrospektiv Gruppen zuweisen, ohne Status zu ändern.
 *
 * Verhalten:
 * - Stellt sicher, dass mindestens eine aktive Gruppe existiert (Fallback: „Akademie“)
 * - Für Kurse ohne Assignment: Assignment + courseGroupId setzen
 * - Für Kurse mit courseGroupId aber ohne Assignment: Assignment nachziehen
 * - Status (draft/published/archived) bleibt unverändert
 *
 * Aufruf: npx tsx scripts/ensure-course-group-assignments.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_GROUP_NAME = "Akademie";
const DEFAULT_GROUP_SLUG = "akademie";

async function ensureDefaultGroup() {
  const existing = await prisma.courseGroup.findFirst({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  if (existing) {
    return existing;
  }

  return prisma.courseGroup.create({
    data: {
      name: DEFAULT_GROUP_NAME,
      slug: DEFAULT_GROUP_SLUG,
      shortDescription: "Alle Kurse der Alles-Wurst Akademie.",
      sortOrder: 100,
      isActive: true,
    },
  });
}

async function main() {
  const fallbackGroup = await ensureDefaultGroup();
  const courses = await prisma.course.findMany({
    select: {
      id: true,
      title: true,
      status: true,
      courseGroupId: true,
      courseSubgroupId: true,
      learningPathAssignments: {
        select: {
          id: true,
          courseGroupId: true,
          isPrimary: true,
        },
        orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
      },
    },
    orderBy: { title: "asc" },
  });

  let assigned = 0;
  let synced = 0;
  let skipped = 0;

  for (const course of courses) {
    const primaryAssignment =
      course.learningPathAssignments.find((a) => a.isPrimary) ??
      course.learningPathAssignments[0] ??
      null;

    if (primaryAssignment) {
      if (course.courseGroupId !== primaryAssignment.courseGroupId) {
        await prisma.course.update({
          where: { id: course.id },
          data: { courseGroupId: primaryAssignment.courseGroupId },
        });
        synced += 1;
        console.log(
          `[sync] ${course.title} (${course.status}) → group ${primaryAssignment.courseGroupId}`,
        );
      } else {
        skipped += 1;
      }
      continue;
    }

    const targetGroupId = course.courseGroupId ?? fallbackGroup.id;

    await prisma.$transaction([
      prisma.courseLearningPathAssignment.create({
        data: {
          courseId: course.id,
          courseGroupId: targetGroupId,
          courseSubgroupId: course.courseSubgroupId,
          isPrimary: true,
          sortOrder: 100,
        },
      }),
      prisma.course.update({
        where: { id: course.id },
        data: { courseGroupId: targetGroupId },
      }),
    ]);

    assigned += 1;
    console.log(
      `[assign] ${course.title} (${course.status}) → group ${targetGroupId}`,
    );
  }

  console.log(
    JSON.stringify(
      {
        fallbackGroup: { id: fallbackGroup.id, name: fallbackGroup.name, slug: fallbackGroup.slug },
        totalCourses: courses.length,
        newlyAssigned: assigned,
        syncedLegacyFk: synced,
        alreadyOk: skipped,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
