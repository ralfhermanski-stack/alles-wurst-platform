/**
 * @file course-import-types.ts
 * @purpose Typen für den JSON-Kursimport.
 */

import type {
  CourseCertificateType,
  CourseLessonType,
  CourseType,
} from "@prisma/client";

export type CourseImportLesson = {
  title: string;
  slug?: string;
  description?: string | null;
  lessonType: CourseLessonType;
  sortOrder?: number;
  durationMinutes?: number | null;
  textContent?: string | null;
  vimeoVideoId?: string | null;
  recipeTitle?: string | null;
  recipeContent?: Record<string, unknown> | null;
  externalUrl?: string | null;
  externalUrlLabel?: string | null;
};

export type CourseImportModule = {
  title: string;
  description?: string | null;
  sortOrder?: number;
  lessons: CourseImportLesson[];
};

export type CourseImportPayload = {
  course: {
    title: string;
    slug?: string;
    subtitle?: string | null;
    shortDescription?: string | null;
    description?: string | null;
    prerequisites?: string | null;
    requiredEquipment?: string | null;
    learningGoals?: string[];
    courseType: CourseType;
    certificateType?: CourseCertificateType;
    certificateOverride?: boolean;
    estimatedMinutes?: number | null;
    priceCents?: number | null;
    priceCurrency?: string;
    featuredOnHomepage?: boolean;
    homepageSortOrder?: number;
  };
  modules: CourseImportModule[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isCourseLessonType(value: string): value is CourseLessonType {
  return (
    value === "video" ||
    value === "text" ||
    value === "download" ||
    value === "recipe" ||
    value === "certificate"
  );
}

function isCourseType(value: string): value is CourseType {
  return value === "minikurs" || value === "zertifikatskurs";
}

function parseImportLesson(value: unknown): CourseImportLesson | null {
  if (!isRecord(value)) {
    return null;
  }

  const title = typeof value.title === "string" ? value.title.trim() : "";
  const lessonType =
    typeof value.lessonType === "string" ? value.lessonType : "";

  if (!title || !isCourseLessonType(lessonType)) {
    return null;
  }

  return {
    title,
    slug: typeof value.slug === "string" ? value.slug : undefined,
    description:
      typeof value.description === "string" ? value.description : null,
    lessonType,
    sortOrder: typeof value.sortOrder === "number" ? value.sortOrder : undefined,
    durationMinutes:
      typeof value.durationMinutes === "number" ? value.durationMinutes : null,
    textContent:
      typeof value.textContent === "string" ? value.textContent : null,
    vimeoVideoId:
      typeof value.vimeoVideoId === "string" ? value.vimeoVideoId : null,
    recipeTitle:
      typeof value.recipeTitle === "string" ? value.recipeTitle : null,
    recipeContent: isRecord(value.recipeContent) ? value.recipeContent : null,
    externalUrl:
      typeof value.externalUrl === "string" ? value.externalUrl : null,
    externalUrlLabel:
      typeof value.externalUrlLabel === "string"
        ? value.externalUrlLabel
        : null,
  };
}

function parseImportModule(value: unknown): CourseImportModule | null {
  if (!isRecord(value)) {
    return null;
  }

  const title = typeof value.title === "string" ? value.title.trim() : "";

  if (!title || !Array.isArray(value.lessons)) {
    return null;
  }

  const lessons = value.lessons
    .map(parseImportLesson)
    .filter((lesson): lesson is CourseImportLesson => lesson !== null);

  return {
    title,
    description:
      typeof value.description === "string" ? value.description : null,
    sortOrder: typeof value.sortOrder === "number" ? value.sortOrder : undefined,
    lessons,
  };
}

/**
 * Parst und validiert ein Import-JSON.
 */
export function parseCourseImportPayload(
  value: unknown,
): { success: true; data: CourseImportPayload } | { success: false; message: string } {
  if (!isRecord(value) || !isRecord(value.course) || !Array.isArray(value.modules)) {
    return {
      success: false,
      message: "Ungültiges Importformat. Erwartet: { course, modules }.",
    };
  }

  const courseRecord = value.course;
  const title =
    typeof courseRecord.title === "string" ? courseRecord.title.trim() : "";
  const courseType =
    typeof courseRecord.courseType === "string" ? courseRecord.courseType : "";

  if (!title) {
    return { success: false, message: "Kurstitel fehlt im Import." };
  }

  if (!isCourseType(courseType)) {
    return {
      success: false,
      message: "Kurstyp muss minikurs oder zertifikatskurs sein.",
    };
  }

  const modules = value.modules
    .map(parseImportModule)
    .filter((module): module is CourseImportModule => module !== null);

  if (modules.length < 1) {
    return { success: false, message: "Mindestens ein Modul ist erforderlich." };
  }

  const certificateType =
    typeof courseRecord.certificateType === "string"
      ? courseRecord.certificateType
      : undefined;

  return {
    success: true,
    data: {
      course: {
        title,
        slug: typeof courseRecord.slug === "string" ? courseRecord.slug : undefined,
        subtitle:
          typeof courseRecord.subtitle === "string" ? courseRecord.subtitle : null,
        shortDescription:
          typeof courseRecord.shortDescription === "string"
            ? courseRecord.shortDescription
            : null,
        description:
          typeof courseRecord.description === "string"
            ? courseRecord.description
            : null,
        prerequisites:
          typeof courseRecord.prerequisites === "string"
            ? courseRecord.prerequisites
            : null,
        requiredEquipment:
          typeof courseRecord.requiredEquipment === "string"
            ? courseRecord.requiredEquipment
            : null,
        learningGoals: Array.isArray(courseRecord.learningGoals)
          ? courseRecord.learningGoals.filter(
              (item): item is string => typeof item === "string",
            )
          : [],
        courseType,
        certificateType:
          certificateType === "none" ||
          certificateType === "participation" ||
          certificateType === "achievement" ||
          certificateType === "masterclass"
            ? certificateType
            : undefined,
        certificateOverride:
          typeof courseRecord.certificateOverride === "boolean"
            ? courseRecord.certificateOverride
            : undefined,
        estimatedMinutes:
          typeof courseRecord.estimatedMinutes === "number"
            ? courseRecord.estimatedMinutes
            : null,
        priceCents:
          typeof courseRecord.priceCents === "number"
            ? courseRecord.priceCents
            : null,
        priceCurrency:
          typeof courseRecord.priceCurrency === "string"
            ? courseRecord.priceCurrency
            : undefined,
        featuredOnHomepage:
          typeof courseRecord.featuredOnHomepage === "boolean"
            ? courseRecord.featuredOnHomepage
            : undefined,
        homepageSortOrder:
          typeof courseRecord.homepageSortOrder === "number"
            ? courseRecord.homepageSortOrder
            : undefined,
      },
      modules,
    },
  };
}
