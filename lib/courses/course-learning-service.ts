/**
 * @file course-learning-service.ts
 * @purpose Lernansicht: Lektionen laden und anzeigen.
 */

import { prisma } from "@/lib/db/prisma";
import {
  userFailure,
  userSuccess,
  type UserServiceResult,
} from "@/lib/users/user-errors";

import { hasActiveCourseAccess } from "./course-access-service";
import { getCourseProgress } from "./course-progress-service";
import type { LessonDetail } from "./course-types";
import { buildVimeoEmbedUrl } from "./vimeo-embed";

function parseRecipeContent(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

/**
 * Lädt eine Lektion für die Lernansicht.
 */
export async function getLessonForUser(
  userId: string,
  courseSlug: string,
  lessonSlug: string,
): Promise<UserServiceResult<LessonDetail | null>> {
  try {
    const course = await prisma.course.findUnique({
      where: { slug: courseSlug },
      include: {
        modules: {
          include: { lessons: true },
        },
      },
    });

    if (!course || course.status !== "published") {
      return userSuccess(null);
    }

    const allowed = await hasActiveCourseAccess(userId, course.id);

    if (!allowed) {
      return userFailure({
        code: "FORBIDDEN",
        message: "Kein Zugriff auf diesen Kurs.",
      });
    }

    const lesson = course.modules
      .flatMap((module) =>
        module.lessons.map((item) => ({ module, lesson: item })),
      )
      .find((entry) => entry.lesson.slug === lessonSlug);

    if (!lesson) {
      return userSuccess(null);
    }

    const progress = await getCourseProgress(userId, course.id);
    const lessonProgress = progress.lessonProgress.find(
      (item) => item.lessonId === lesson.lesson.id,
    );

    const canAccessCertificate =
      lesson.lesson.lessonType !== "certificate" || progress.courseCompleted;

    const userCertificate = await prisma.userCourseCertificate.findUnique({
      where: {
        userId_courseId: { userId, courseId: course.id },
      },
    });

    if (lesson.lesson.lessonType === "certificate" && !canAccessCertificate) {
      return userFailure({
        code: "FORBIDDEN",
        message: "Zertifikat erst nach Kursabschluss verfügbar.",
      });
    }

    const detail: LessonDetail = {
      id: lesson.lesson.id,
      moduleId: lesson.lesson.moduleId,
      slug: lesson.lesson.slug,
      title: lesson.lesson.title,
      description: lesson.lesson.description,
      lessonType: lesson.lesson.lessonType,
      sortOrder: lesson.lesson.sortOrder,
      durationMinutes: lesson.lesson.durationMinutes,
      courseSlug: course.slug,
      courseTitle: course.title,
      moduleTitle: lesson.module.title,
      textContent: lesson.lesson.textContent,
      hasDownload: Boolean(lesson.lesson.downloadStorageKey),
      downloadFileName: lesson.lesson.downloadFileName,
      recipeTitle: lesson.lesson.recipeTitle,
      recipeContent: parseRecipeContent(lesson.lesson.recipeContent),
      vimeoEmbedUrl: lesson.lesson.vimeoVideoId
        ? buildVimeoEmbedUrl(lesson.lesson.vimeoVideoId)
        : null,
      completed: lessonProgress?.completed ?? false,
      canAccessCertificate,
      certificateId: userCertificate?.id ?? null,
      certificateStatus: userCertificate?.status ?? null,
    };

    return userSuccess(detail);
  } catch {
    return userFailure({
      code: "INTERNAL_ERROR",
      message: "Lektion konnte nicht geladen werden.",
    });
  }
}

/**
 * Lädt Download-Metadaten einer Lektion (mit Zugriffsprüfung).
 */
export async function getLessonDownloadForUser(
  userId: string,
  lessonId: string,
): Promise<
  UserServiceResult<{
    storageKey: string;
    fileName: string;
    courseId: string;
  } | null>
> {
  try {
    const lesson = await prisma.courseLesson.findUnique({
      where: { id: lessonId },
      include: { module: { include: { course: true } } },
    });

    if (!lesson?.downloadStorageKey || !lesson.downloadFileName) {
      return userSuccess(null);
    }

    const courseId = lesson.module.courseId;
    const allowed = await hasActiveCourseAccess(userId, courseId);

    if (!allowed) {
      return userFailure({
        code: "FORBIDDEN",
        message: "Kein Zugriff auf diesen Download.",
      });
    }

    return userSuccess({
      storageKey: lesson.downloadStorageKey,
      fileName: lesson.downloadFileName,
      courseId,
    });
  } catch {
    return userFailure({
      code: "INTERNAL_ERROR",
      message: "Download konnte nicht geladen werden.",
    });
  }
}
