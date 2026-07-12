/**
 * @file course-progress-service.ts
 * @purpose Lektions-, Modul- und Kursfortschritt.
 */

import type { CourseLessonType } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import {
  userFailure,
  userSuccess,
  type UserServiceResult,
} from "@/lib/users/user-errors";

import { hasActiveCourseAccess } from "./course-access-service";
import type { CourseProgressSummary, LessonProgressEntry } from "./course-types";

const COURSE_INCLUDE = {
  modules: {
    orderBy: { sortOrder: "asc" as const },
    include: {
      lessons: { orderBy: { sortOrder: "asc" as const } },
    },
  },
};

function isCountableLesson(lessonType: CourseLessonType): boolean {
  return lessonType !== "certificate";
}

function calculatePercent(completed: number, total: number): number {
  if (total === 0) {
    return 0;
  }

  return Math.round((completed / total) * 100);
}

/**
 * Berechnet den Kursfortschritt eines Nutzers.
 */
export async function getCourseProgress(
  userId: string,
  courseId: string,
): Promise<CourseProgressSummary> {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: COURSE_INCLUDE,
  });

  if (!course) {
    return {
      courseId,
      totalLessons: 0,
      completedLessons: 0,
      percentComplete: 0,
      courseCompleted: false,
      moduleProgress: [],
      lessonProgress: [],
    };
  }

  const allLessons = course.modules.flatMap((module) => module.lessons);
  const countableLessons = allLessons.filter((lesson) =>
    isCountableLesson(lesson.lessonType),
  );

  const progressRows = await prisma.courseLessonProgress.findMany({
    where: {
      userId,
      lessonId: { in: allLessons.map((lesson) => lesson.id) },
    },
  });

  const progressMap = new Map(
    progressRows.map((row) => [row.lessonId, row]),
  );

  const lessonProgress: LessonProgressEntry[] = allLessons.map((lesson) => {
    const row = progressMap.get(lesson.id);

    return {
      lessonId: lesson.id,
      completed: row?.completed ?? false,
      completedAt: row?.completedAt?.toISOString() ?? null,
      lastViewedAt: row?.lastViewedAt?.toISOString() ?? null,
    };
  });

  const completedLessons = countableLessons.filter(
    (lesson) => progressMap.get(lesson.id)?.completed,
  ).length;

  const moduleProgress = course.modules.map((module) => {
    const moduleLessons = module.lessons.filter((lesson) =>
      isCountableLesson(lesson.lessonType),
    );
    const moduleCompleted = moduleLessons.filter(
      (lesson) => progressMap.get(lesson.id)?.completed,
    ).length;

    return {
      moduleId: module.id,
      totalLessons: moduleLessons.length,
      completedLessons: moduleCompleted,
      percentComplete: calculatePercent(moduleCompleted, moduleLessons.length),
    };
  });

  const courseCompleted =
    countableLessons.length > 0 &&
    completedLessons >= countableLessons.length;

  return {
    courseId,
    totalLessons: countableLessons.length,
    completedLessons,
    percentComplete: calculatePercent(
      completedLessons,
      countableLessons.length,
    ),
    courseCompleted,
    moduleProgress,
    lessonProgress,
  };
}

async function refreshCertificateForUser(
  userId: string,
  courseId: string,
): Promise<void> {
  const course = await prisma.course.findUnique({ where: { id: courseId } });

  // Nachweis wird für jeden Kurs mit gewähltem Abschlussnachweis erstellt
  // (Teilnahmeurkunde für Minikurse, Zertifikat für Zertifikatskurse).
  if (!course || course.certificateType === "none") {
    return;
  }

  const progress = await getCourseProgress(userId, courseId);

  const status = progress.courseCompleted ? "available" : "locked";

  await prisma.userCourseCertificate.upsert({
    where: { userId_courseId: { userId, courseId } },
    create: {
      userId,
      courseId,
      certificateType: course.certificateType,
      status,
    },
    update: {
      certificateType: course.certificateType,
      status,
    },
  });
}

/**
 * Markiert eine Lektion als angesehen und optional abgeschlossen.
 */
export async function updateLessonProgress(
  userId: string,
  lessonId: string,
  completed: boolean,
): Promise<UserServiceResult<CourseProgressSummary>> {
  try {
    const lesson = await prisma.courseLesson.findUnique({
      where: { id: lessonId },
      include: {
        module: { include: { course: true } },
      },
    });

    if (!lesson) {
      return userFailure({
        code: "NOT_FOUND",
        message: "Lektion wurde nicht gefunden.",
      });
    }

    const courseId = lesson.module.courseId;

    const allowed = await hasActiveCourseAccess(userId, courseId);

    if (!allowed) {
      return userFailure({
        code: "FORBIDDEN",
        message: "Kein Zugriff auf diesen Kurs.",
      });
    }

    if (lesson.lessonType === "certificate") {
      const progress = await getCourseProgress(userId, courseId);

      if (!progress.courseCompleted) {
        return userFailure({
          code: "VALIDATION_ERROR",
          message:
            "Das Zertifikat wird erst nach Kursabschluss freigeschaltet.",
        });
      }
    }

    const now = new Date();

    await prisma.courseLessonProgress.upsert({
      where: {
        userId_lessonId: { userId, lessonId },
      },
      create: {
        userId,
        lessonId,
        completed,
        completedAt: completed ? now : null,
        lastViewedAt: now,
      },
      update: {
        completed,
        completedAt: completed ? now : undefined,
        lastViewedAt: now,
      },
    });

    await refreshCertificateForUser(userId, courseId);

    const summary = await getCourseProgress(userId, courseId);

    return userSuccess(summary);
  } catch {
    return userFailure({
      code: "INTERNAL_ERROR",
      message: "Fortschritt konnte nicht gespeichert werden.",
    });
  }
}

/**
 * Lädt den Zertifikatsstatus eines Nutzers für einen Kurs.
 */
export async function getUserCertificateStatus(
  userId: string,
  courseId: string,
) {
  const row = await prisma.userCourseCertificate.findUnique({
    where: { userId_courseId: { userId, courseId } },
  });

  return row?.status ?? null;
}
