/**
 * @file course-types.ts
 * @purpose Typen für die Kursplattform.
 */

import type {
  Course,
  CourseCertificateType,
  CourseGroup,
  CourseLesson,
  CourseLessonType,
  CourseModule,
  CourseStatus,
  CourseSubgroup,
  CourseType,
  UserCertificateStatus,
} from "@prisma/client";
import type { CourseGroupRef, CourseSubgroupRef } from "@/lib/course-groups/course-group-types";

export type CertificateProofType = "participation" | "achievement";

export type CourseSummary = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  shortDescription: string | null;
  courseType: CourseType;
  status: CourseStatus;
  estimatedMinutes: number | null;
  certificateType: CourseCertificateType;
  certificateOverride: boolean;
  priceCents: number | null;
  priceCurrency: string;
  featuredOnHomepage: boolean;
  homepageSortOrder: number;
  forumsEnabled: boolean;
  courseGroupId: string | null;
  courseSubgroupId: string | null;
  group: CourseGroupRef | null;
  subgroup: CourseSubgroupRef | null;
  productId: string | null;
  hasCover: boolean;
  coverFileName: string | null;
  moduleCount: number;
  lessonCount: number;
};

export type CourseLessonEntry = {
  id: string;
  moduleId: string;
  slug: string;
  title: string;
  description: string | null;
  lessonType: CourseLessonType;
  sortOrder: number;
  durationMinutes: number | null;
};

export type AdminLessonEntry = CourseLessonEntry & {
  textContent: string | null;
  vimeoVideoId: string | null;
  hasDownload: boolean;
  downloadFileName: string | null;
  recipeTitle: string | null;
  recipeContent: Record<string, unknown> | null;
};

export type CourseModuleEntry = {
  id: string;
  courseId: string;
  title: string;
  description: string | null;
  sortOrder: number;
  lessons: CourseLessonEntry[];
};

export type AdminCourseModuleEntry = Omit<CourseModuleEntry, "lessons"> & {
  lessons: AdminLessonEntry[];
};

export type CourseDetail = CourseSummary & {
  description: string | null;
  prerequisites: string | null;
  requiredEquipment: string | null;
  learningGoals: string[];
  modules: CourseModuleEntry[];
  publishedAt: string | null;
};

export type LessonProgressEntry = {
  lessonId: string;
  completed: boolean;
  completedAt: string | null;
  lastViewedAt: string | null;
};

export type CourseProgressSummary = {
  courseId: string;
  totalLessons: number;
  completedLessons: number;
  percentComplete: number;
  courseCompleted: boolean;
  moduleProgress: Array<{
    moduleId: string;
    totalLessons: number;
    completedLessons: number;
    percentComplete: number;
  }>;
  lessonProgress: LessonProgressEntry[];
};

export type UserCourseEntry = {
  course: CourseSummary;
  hasAccess: boolean;
  accessSource: string | null;
  expiresAt: string | null;
  progress: CourseProgressSummary;
  certificateStatus: UserCertificateStatus | null;
};

export type LessonDetail = CourseLessonEntry & {
  courseSlug: string;
  courseTitle: string;
  moduleTitle: string;
  textContent: string | null;
  hasDownload: boolean;
  downloadFileName: string | null;
  recipeTitle: string | null;
  recipeContent: Record<string, unknown> | null;
  vimeoEmbedUrl: string | null;
  completed: boolean;
  canAccessCertificate: boolean;
  certificateId: string | null;
  certificateStatus: string | null;
};

import type { CourseReviewSummary } from "@/lib/reviews/course-review-types";

export type CourseSalesProductStatus = {
  exists: boolean;
  active: boolean;
  hasActivePrice: boolean;
  productSlug: string | null;
};

export type AdminCourseRecord = Omit<CourseDetail, "modules"> & {
  modules: AdminCourseModuleEntry[];
  createdAt: string;
  updatedAt: string;
  salesProduct: CourseSalesProductStatus;
  reviewStats: CourseReviewSummary;
};

export function slugifyCourseTitle(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Normalisiert einen manuell eingegebenen Slug für die Speicherung. */
export function normalizeCourseSlugInput(value: string): string {
  return slugifyCourseTitle(value) || "kurs";
}

/** Dekodiert einen Slug aus der URL (z. B. %20 → Leerzeichen). */
export function normalizeCourseSlugParam(value: string): string {
  try {
    return decodeURIComponent(value).trim();
  } catch {
    return value.trim();
  }
}

export function parseLearningGoals(value: string | null | undefined): string[] {
  if (!value?.trim()) {
    return [];
  }

  return value
    .split("|")
    .map((part) => part.trim())
    .filter(Boolean);
}

export function serializeLearningGoals(goals: string[]): string | null {
  const filtered = goals.map((g) => g.trim()).filter(Boolean);

  return filtered.length > 0 ? filtered.join("|") : null;
}

export function toCourseLessonEntry(lesson: CourseLesson): CourseLessonEntry {
  return {
    id: lesson.id,
    moduleId: lesson.moduleId,
    slug: lesson.slug,
    title: lesson.title,
    description: lesson.description,
    lessonType: lesson.lessonType,
    sortOrder: lesson.sortOrder,
    durationMinutes: lesson.durationMinutes,
  };
}

export function toAdminLessonEntry(lesson: CourseLesson): AdminLessonEntry {
  return {
    ...toCourseLessonEntry(lesson),
    textContent: lesson.textContent,
    vimeoVideoId: lesson.vimeoVideoId,
    hasDownload: Boolean(lesson.downloadStorageKey),
    downloadFileName: lesson.downloadFileName,
    recipeTitle: lesson.recipeTitle,
    recipeContent:
      lesson.recipeContent && typeof lesson.recipeContent === "object"
        ? (lesson.recipeContent as Record<string, unknown>)
        : null,
  };
}

export function toCourseModuleEntry(
  module: CourseModule & { lessons: CourseLesson[] },
): CourseModuleEntry {
  return {
    id: module.id,
    courseId: module.courseId,
    title: module.title,
    description: module.description,
    sortOrder: module.sortOrder,
    lessons: module.lessons
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(toCourseLessonEntry),
  };
}

export function toAdminCourseModuleEntry(
  module: CourseModule & { lessons: CourseLesson[] },
): AdminCourseModuleEntry {
  return {
    id: module.id,
    courseId: module.courseId,
    title: module.title,
    description: module.description,
    sortOrder: module.sortOrder,
    lessons: module.lessons
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(toAdminLessonEntry),
  };
}

export function toCourseSummary(
  course: Course & {
    modules: Array<CourseModule & { lessons: CourseLesson[] }>;
    courseGroup?: Pick<CourseGroup, "id" | "name" | "slug"> | null;
    courseSubgroup?: Pick<CourseSubgroup, "id" | "name" | "slug" | "courseGroupId"> | null;
  },
): CourseSummary {
  const lessonCount = course.modules.reduce(
    (sum, module) => sum + module.lessons.length,
    0,
  );

  return {
    id: course.id,
    slug: course.slug,
    title: course.title,
    subtitle: course.subtitle,
    shortDescription: course.shortDescription,
    courseType: course.courseType,
    status: course.status,
    estimatedMinutes: course.estimatedMinutes,
    certificateType: course.certificateType,
    certificateOverride: course.certificateOverride,
    priceCents: course.priceCents,
    priceCurrency: course.priceCurrency,
    featuredOnHomepage: course.featuredOnHomepage,
    homepageSortOrder: course.homepageSortOrder,
    forumsEnabled: course.forumsEnabled,
    courseGroupId: course.courseGroupId,
    courseSubgroupId: course.courseSubgroupId,
    group: course.courseGroup
      ? {
          id: course.courseGroup.id,
          name: course.courseGroup.name,
          slug: course.courseGroup.slug,
        }
      : null,
    subgroup: course.courseSubgroup
      ? {
          id: course.courseSubgroup.id,
          name: course.courseSubgroup.name,
          slug: course.courseSubgroup.slug,
          courseGroupId: course.courseSubgroup.courseGroupId,
        }
      : null,
    productId: course.productId,
    hasCover: Boolean(course.coverStorageKey),
    coverFileName: course.coverFileName,
    moduleCount: course.modules.length,
    lessonCount,
  };
}

export function toCourseDetail(
  course: Course & {
    modules: Array<CourseModule & { lessons: CourseLesson[] }>;
  },
): CourseDetail {
  return {
    ...toCourseSummary(course),
    description: course.description,
    prerequisites: course.prerequisites,
    requiredEquipment: course.requiredEquipment,
    learningGoals: parseLearningGoals(course.learningGoals),
    publishedAt: course.publishedAt?.toISOString() ?? null,
    modules: course.modules
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(toCourseModuleEntry),
  };
}

export function toAdminCourseDetail(
  course: Course & {
    modules: Array<CourseModule & { lessons: CourseLesson[] }>;
  },
): CourseDetail & { modules: AdminCourseModuleEntry[] } {
  return {
    ...toCourseSummary(course),
    description: course.description,
    prerequisites: course.prerequisites,
    requiredEquipment: course.requiredEquipment,
    learningGoals: parseLearningGoals(course.learningGoals),
    publishedAt: course.publishedAt?.toISOString() ?? null,
    modules: course.modules
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(toAdminCourseModuleEntry),
  };
}
