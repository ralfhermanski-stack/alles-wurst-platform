/**
 * @file admin-course-service.ts
 * @purpose Admin-CRUD für Kurse, Module, Lektionen und Mitgliedschaftsregeln.
 */

import type {
  CourseCertificateType,
  CourseLessonType,
  CourseStatus,
  CourseType,
  MembershipRole,
  BillingPeriod,
} from "@prisma/client";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { notifyCoursePageSeoChange } from "@/lib/page-seo/page-seo-enqueue";
import {
  userFailure,
  userSuccess,
  type UserServiceResult,
} from "@/lib/users/user-errors";

import {
  serializeLearningGoals,
  slugifyCourseTitle,
  normalizeCourseSlugInput,
  toAdminCourseDetail,
  toCourseDetail,
  toCourseSummary,
  type AdminCourseRecord,
  type CertificateProofType,
  type CourseDetail,
  type CourseSummary,
} from "./course-types";
import type { CourseImportPayload } from "./course-import-types";
import { getCourseCheckoutTarget } from "./course-catalog-service";
import {
  isValidLessonExternalUrl,
  normalizeLessonExternalUrl,
} from "./course-lesson-url";
import {
  archiveCourseProduct,
  getCourseSalesProductStatus,
  syncCourseProduct,
} from "./course-product-sync";
import { certificateKindFromCourseType } from "@/lib/certificates/certificate-defaults";
import { hasReadyCertificateTemplate } from "@/lib/certificates/certificate-template-service";
import {
  formatValidationIssues,
  validateCourseForPublish,
  type CourseValidationIssue,
} from "./course-validation";
import { parseVimeoVideoInput } from "./vimeo-embed";
import { getCourseReviewStatsForAdmin } from "@/lib/reviews/course-review-service";
import { ensureCourseForumInfrastructure } from "@/lib/forums/forum-service";
import {
  validateCourseGroupAssignment,
  syncCourseLearningPathAssignments,
  listCourseLearningPathAssignments,
} from "@/lib/course-groups/course-group-service";
import {
  syncCourseProductRecommendationLinks,
  listLinkedProductIdsForCourse,
} from "@/lib/product-recommendations/product-recommendation-admin-service";
import type { LearningPathAssignmentInput } from "@/lib/course-groups/course-group-types";

const COURSE_INCLUDE = {
  modules: {
    orderBy: { sortOrder: "asc" as const },
    include: {
      lessons: { orderBy: { sortOrder: "asc" as const } },
    },
  },
  courseGroup: { select: { id: true, name: true, slug: true, isActive: true } },
  courseSubgroup: {
    select: {
      id: true,
      name: true,
      slug: true,
      courseGroupId: true,
      isActive: true,
    },
  },
};

type CourseWithModules = Prisma.CourseGetPayload<{ include: typeof COURSE_INCLUDE }>;

async function toAdminRecord(course: CourseWithModules): Promise<AdminCourseRecord> {
  const detail = toAdminCourseDetail(course);
  const [salesProduct, reviewStats, learningPathAssignments, linkedProductIds] =
    await Promise.all([
    getCourseSalesProductStatus(course.productId),
    getCourseReviewStatsForAdmin(course.id),
    listCourseLearningPathAssignments(course.id),
    listLinkedProductIdsForCourse(course.id),
  ]);

  return {
    ...detail,
    createdAt: course.createdAt.toISOString(),
    updatedAt: course.updatedAt.toISOString(),
    salesProduct,
    reviewStats,
    learningPathAssignments,
    linkedProductIds,
  };
}

/** Lädt einen Kurs frisch inkl. Module und baut den Admin-Datensatz. */
async function reloadAdminRecord(courseId: string): Promise<AdminCourseRecord | null> {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: COURSE_INCLUDE,
  });

  if (!course) {
    return null;
  }

  return toAdminRecord(course);
}

async function buildValidationInput(course: CourseWithModules) {
  const checkoutTarget = await getCourseCheckoutTarget(course.productId);
  const requiredKind = certificateKindFromCourseType(course.certificateType);
  const hasCertificateTemplate = requiredKind
    ? await hasReadyCertificateTemplate(requiredKind)
    : true;
  const learningPathAssignments = await listCourseLearningPathAssignments(course.id);

  return {
    courseType: course.courseType,
    title: course.title,
    description: course.description,
    shortDescription: course.shortDescription,
    priceCents: course.priceCents,
    productId: course.productId,
    hasCheckoutLink: checkoutTarget !== null,
    certificateType: course.certificateType,
    certificateOverride: course.certificateOverride,
    hasCertificateTemplate,
    courseGroupId: course.courseGroupId,
    courseSubgroupId: course.courseSubgroupId,
    groupIsActive: course.courseGroup?.isActive ?? null,
    subgroupIsActive: course.courseSubgroup?.isActive ?? null,
    learningPathAssignments: learningPathAssignments.map((assignment) => ({
      groupName: assignment.group.name,
      subgroupName: assignment.subgroup?.name ?? null,
      groupIsActive: assignment.group.isActive,
      subgroupIsActive: assignment.subgroup?.isActive ?? null,
    })),
    modules: course.modules.map((courseModule) => ({
      id: courseModule.id,
      title: courseModule.title,
      lessons: courseModule.lessons.map((lesson) => ({
        id: lesson.id,
        title: lesson.title,
        lessonType: lesson.lessonType,
        vimeoVideoId: lesson.vimeoVideoId,
      })),
    })),
  };
}

async function allocateUniqueSlug(baseSlug: string): Promise<string> {
  const normalized = baseSlug.toLowerCase().trim() || "kurs";
  let candidate = normalized;
  let counter = 2;

  while (await prisma.course.findUnique({ where: { slug: candidate } })) {
    candidate = `${normalized}-kopie-${counter}`;
    counter += 1;
  }

  return candidate;
}

function normalizeVimeoVideoId(value: string | null | undefined): string | null {
  if (value === undefined || value === null) {
    return null;
  }

  const parsed = parseVimeoVideoInput(value);

  return parsed || null;
}

export type CreateCourseInput = {
  title: string;
  slug?: string;
  subtitle?: string | null;
  shortDescription?: string | null;
  description?: string | null;
  prerequisites?: string | null;
  requiredEquipment?: string | null;
  learningGoals?: string[];
  courseType: CourseType;
  status?: CourseStatus;
  certificateType?: CourseCertificateType;
  certificateOverride?: boolean;
  estimatedMinutes?: number | null;
  priceCents?: number | null;
  priceCurrency?: string;
  featuredOnHomepage?: boolean;
  homepageSortOrder?: number;
  forumsEnabled?: boolean;
  courseGroupId?: string | null;
  courseSubgroupId?: string | null;
  learningPathAssignments?: LearningPathAssignmentInput[];
  linkedProductIds?: string[];
  productId?: string | null;
};

export type UpdateCourseInput = Partial<CreateCourseInput>;

export type CreateModuleInput = {
  title: string;
  description?: string | null;
  sortOrder?: number;
};

export type UpdateModuleInput = Partial<CreateModuleInput>;

export type CreateLessonInput = {
  title: string;
  slug?: string;
  description?: string | null;
  lessonType: CourseLessonType;
  sortOrder?: number;
  durationMinutes?: number | null;
  textContent?: string | null;
  vimeoVideoId?: string | null;
  recipeId?: string | null;
  recipeTitle?: string | null;
  recipeContent?: Record<string, unknown> | null;
  externalUrl?: string | null;
  externalUrlLabel?: string | null;
  /** Setzt den Kurs-Abschlussnachweis bei Lektionstyp „certificate“. */
  certificateProofType?: CertificateProofType;
};

export type UpdateLessonInput = Partial<CreateLessonInput> & {
  downloadStorageKey?: string | null;
  downloadFileName?: string | null;
};

export type MembershipCourseRuleEntry = {
  id: string;
  membershipRole: MembershipRole;
  courseId: string;
  courseTitle: string;
  billingPeriod: BillingPeriod | null;
  active: boolean;
  note: string | null;
};

export async function listAdminCourses(): Promise<CourseSummary[]> {
  const courses = await prisma.course.findMany({
    include: COURSE_INCLUDE,
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
  });

  return courses.map(toCourseSummary);
}

export async function getAdminCourse(
  courseId: string,
): Promise<UserServiceResult<AdminCourseRecord | null>> {
  try {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: COURSE_INCLUDE,
    });

    if (!course) {
      return userSuccess(null);
    }

    return userSuccess(await toAdminRecord(course));
  } catch {
    return userFailure({
      code: "INTERNAL_ERROR",
      message: "Kurs konnte nicht geladen werden.",
    });
  }
}

export async function createCourse(
  input: CreateCourseInput,
): Promise<UserServiceResult<AdminCourseRecord>> {
  try {
    const title = input.title.trim();

    if (!title) {
      return userFailure({
        code: "VALIDATION_ERROR",
        message: "Kurstitel ist erforderlich.",
      });
    }

    const slug = normalizeCourseSlugInput(input.slug?.trim() || title);

    const course = await prisma.course.create({
      data: {
        title,
        slug,
        subtitle: input.subtitle?.trim() || null,
        shortDescription: input.shortDescription?.trim() || null,
        description: input.description?.trim() || null,
        prerequisites: input.prerequisites?.trim() || null,
        requiredEquipment: input.requiredEquipment?.trim() || null,
        learningGoals: serializeLearningGoals(input.learningGoals ?? []),
        courseType: input.courseType,
        status: input.status ?? "draft",
        certificateType: input.certificateType ?? "participation",
        certificateOverride: input.certificateOverride ?? false,
        estimatedMinutes: input.estimatedMinutes ?? null,
        priceCents: input.priceCents ?? null,
        priceCurrency: input.priceCurrency ?? "EUR",
        featuredOnHomepage: input.featuredOnHomepage ?? false,
        homepageSortOrder: input.homepageSortOrder ?? 100,
        forumsEnabled: input.forumsEnabled ?? false,
        productId: input.productId ?? null,
        publishedAt: input.status === "published" ? new Date() : null,
      },
      include: COURSE_INCLUDE,
    });

    // Ein Kurs = ein Verkaufsprodukt: Produkt automatisch erzeugen/verknüpfen.
    await syncCourseProduct(course.id);
    const record = await reloadAdminRecord(course.id);

    return userSuccess(record ?? (await toAdminRecord(course)));
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return userFailure({
        code: "CONFLICT",
        message: "Slug oder Produktverknüpfung ist bereits vergeben.",
      });
    }

    return userFailure({
      code: "INTERNAL_ERROR",
      message: "Kurs konnte nicht angelegt werden.",
    });
  }
}

export async function updateCourseCover(
  courseId: string,
  coverStorageKey: string,
  coverFileName: string,
): Promise<UserServiceResult<AdminCourseRecord>> {
  try {
    const course = await prisma.course.update({
      where: { id: courseId },
      data: { coverStorageKey, coverFileName },
      include: COURSE_INCLUDE,
    });

    return userSuccess(await toAdminRecord(course));
  } catch {
    return userFailure({
      code: "INTERNAL_ERROR",
      message: "Coverbild konnte nicht gespeichert werden.",
    });
  }
}

export async function getCourseCoverStorageKey(
  courseId: string,
): Promise<string | null> {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { coverStorageKey: true },
  });

  return course?.coverStorageKey ?? null;
}

export async function updateCourse(
  courseId: string,
  input: UpdateCourseInput,
): Promise<UserServiceResult<AdminCourseRecord>> {
  try {
    const existing = await prisma.course.findUnique({ where: { id: courseId } });

    if (!existing) {
      return userFailure({
        code: "NOT_FOUND",
        message: "Kurs wurde nicht gefunden.",
      });
    }

    const nextStatus = input.status ?? existing.status;

    let nextGroupId =
      input.courseGroupId !== undefined
        ? input.courseGroupId
        : existing.courseGroupId;
    let nextSubgroupId =
      input.courseSubgroupId !== undefined
        ? input.courseSubgroupId
        : existing.courseSubgroupId;

    if (!nextGroupId) {
      nextSubgroupId = null;
    } else if (
      input.courseGroupId !== undefined &&
      input.courseGroupId !== existing.courseGroupId &&
      nextSubgroupId
    ) {
      const subgroup = await prisma.courseSubgroup.findUnique({
        where: { id: nextSubgroupId },
        select: { courseGroupId: true },
      });

      if (!subgroup || subgroup.courseGroupId !== nextGroupId) {
        nextSubgroupId = null;
      }
    }

    if (input.learningPathAssignments !== undefined) {
      const syncResult = await syncCourseLearningPathAssignments(
        courseId,
        input.learningPathAssignments,
        { requireActive: nextStatus === "published" },
      );

      if (!syncResult.success) {
        return syncResult as UserServiceResult<AdminCourseRecord>;
      }

      nextGroupId = syncResult.data.primaryGroupId;
      nextSubgroupId = syncResult.data.primarySubgroupId;
    } else if (
      input.courseGroupId !== undefined ||
      input.courseSubgroupId !== undefined
    ) {
      if (nextGroupId) {
        const assignmentCheck = await validateCourseGroupAssignment(
          nextGroupId,
          nextSubgroupId,
          { requireActive: nextStatus === "published" },
        );

        if (!assignmentCheck.success) {
          return assignmentCheck as UserServiceResult<AdminCourseRecord>;
        }

        const syncResult = await syncCourseLearningPathAssignments(
          courseId,
          [
            {
              courseGroupId: nextGroupId,
              courseSubgroupId: nextSubgroupId,
              isPrimary: true,
            },
          ],
          { requireActive: nextStatus === "published" },
        );

        if (!syncResult.success) {
          return syncResult as UserServiceResult<AdminCourseRecord>;
        }
      } else {
        await prisma.courseLearningPathAssignment.deleteMany({
          where: { courseId },
        });
      }
    }

    // 1. Inhaltsfelder aktualisieren (Statuswechsel wird separat geprüft).
    await prisma.course.update({
      where: { id: courseId },
      data: {
        title: input.title?.trim(),
        slug: input.slug !== undefined ? normalizeCourseSlugInput(input.slug) : undefined,
        subtitle:
          input.subtitle !== undefined ? input.subtitle?.trim() || null : undefined,
        shortDescription:
          input.shortDescription !== undefined
            ? input.shortDescription?.trim() || null
            : undefined,
        description:
          input.description !== undefined
            ? input.description?.trim() || null
            : undefined,
        prerequisites:
          input.prerequisites !== undefined
            ? input.prerequisites?.trim() || null
            : undefined,
        requiredEquipment:
          input.requiredEquipment !== undefined
            ? input.requiredEquipment?.trim() || null
            : undefined,
        learningGoals:
          input.learningGoals !== undefined
            ? serializeLearningGoals(input.learningGoals)
            : undefined,
        courseType: input.courseType,
        certificateType: input.certificateType,
        certificateOverride: input.certificateOverride,
        estimatedMinutes: input.estimatedMinutes,
        priceCents: input.priceCents,
        priceCurrency: input.priceCurrency,
        featuredOnHomepage: input.featuredOnHomepage,
        homepageSortOrder: input.homepageSortOrder,
        forumsEnabled: input.forumsEnabled,
        courseGroupId:
          input.learningPathAssignments !== undefined ||
          input.courseGroupId !== undefined ||
          input.courseSubgroupId !== undefined
            ? nextGroupId
            : undefined,
        courseSubgroupId:
          input.learningPathAssignments !== undefined ||
          input.courseGroupId !== undefined ||
          input.courseSubgroupId !== undefined
            ? nextSubgroupId
            : undefined,
      },
    });

    // 2. Verkaufsprodukt automatisch synchronisieren (Name/Preis/Beschreibung).
    await syncCourseProduct(courseId);

    if (input.linkedProductIds !== undefined) {
      const productLinkResult = await syncCourseProductRecommendationLinks(
        courseId,
        input.linkedProductIds,
      );

      if (!productLinkResult.success) {
        return productLinkResult as UserServiceResult<AdminCourseRecord>;
      }
    }

    // 3. Bei Veröffentlichung nach der Synchronisierung validieren.
    if (nextStatus === "published") {
      const fullCourse = await prisma.course.findUnique({
        where: { id: courseId },
        include: COURSE_INCLUDE,
      });

      if (fullCourse) {
        const issues = validateCourseForPublish(
          await buildValidationInput(fullCourse),
        );

        if (issues.length > 0) {
          return userFailure({
            code: "VALIDATION_ERROR",
            message: formatValidationIssues(issues),
          });
        }
      }
    }

    // 4. Statuswechsel anwenden.
    await prisma.course.update({
      where: { id: courseId },
      data: {
        status: input.status,
        publishedAt:
          nextStatus === "published"
            ? existing.publishedAt ?? new Date()
            : input.status === "draft"
              ? null
              : undefined,
      },
    });

    const record = await reloadAdminRecord(courseId);

    if (!record) {
      return userFailure({
        code: "NOT_FOUND",
        message: "Kurs wurde nicht gefunden.",
      });
    }

    if (record.forumsEnabled) {
      await ensureCourseForumInfrastructure(courseId);
    }

    void notifyCoursePageSeoChange(record.slug, record.status).catch((error) => {
      console.warn("[page-seo] Kurs-SEO-Queue fehlgeschlagen:", error);
    });

    return userSuccess(record);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return userFailure({
        code: "CONFLICT",
        message: "Slug oder Produktverknüpfung ist bereits vergeben.",
      });
    }

    return userFailure({
      code: "INTERNAL_ERROR",
      message: "Kurs konnte nicht aktualisiert werden.",
    });
  }
}

export async function getCourseValidationIssues(
  courseId: string,
): Promise<UserServiceResult<CourseValidationIssue[]>> {
  try {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: COURSE_INCLUDE,
    });

    if (!course) {
      return userFailure({
        code: "NOT_FOUND",
        message: "Kurs wurde nicht gefunden.",
      });
    }

    return userSuccess(
      validateCourseForPublish(await buildValidationInput(course)),
    );
  } catch {
    return userFailure({
      code: "INTERNAL_ERROR",
      message: "Validierung konnte nicht ausgeführt werden.",
    });
  }
}

export async function publishCourse(
  courseId: string,
): Promise<UserServiceResult<AdminCourseRecord>> {
  const validation = await getCourseValidationIssues(courseId);

  if (!validation.success) {
    return userFailure(validation.error);
  }

  if (validation.data.length > 0) {
    return userFailure({
      code: "VALIDATION_ERROR",
      message: formatValidationIssues(validation.data),
    });
  }

  const result = await updateCourse(courseId, { status: "published" });

  if (result.success) {
    await ensureCourseForumInfrastructure(courseId);
  }

  return result;
}

export async function archiveCourse(
  courseId: string,
): Promise<UserServiceResult<AdminCourseRecord>> {
  return updateCourse(courseId, { status: "archived" });
}

export async function duplicateCourse(
  courseId: string,
): Promise<UserServiceResult<AdminCourseRecord>> {
  try {
    const source = await prisma.course.findUnique({
      where: { id: courseId },
      include: COURSE_INCLUDE,
    });

    if (!source) {
      return userFailure({
        code: "NOT_FOUND",
        message: "Kurs wurde nicht gefunden.",
      });
    }

    const newSlug = await allocateUniqueSlug(`${source.slug}-kopie`);

    const created = await prisma.$transaction(async (tx) => {
      const course = await tx.course.create({
        data: {
          title: `${source.title} (Kopie)`,
          slug: newSlug,
          subtitle: source.subtitle,
          shortDescription: source.shortDescription,
          description: source.description,
          prerequisites: source.prerequisites,
          requiredEquipment: source.requiredEquipment,
          learningGoals: source.learningGoals,
          courseType: source.courseType,
          status: "draft",
          certificateType: source.certificateType,
          certificateOverride: source.certificateOverride,
          estimatedMinutes: source.estimatedMinutes,
          priceCents: source.priceCents,
          priceCurrency: source.priceCurrency,
          featuredOnHomepage: false,
          homepageSortOrder: source.homepageSortOrder,
          forumsEnabled: source.forumsEnabled,
          productId: null,
          publishedAt: null,
        },
      });

      for (const courseModule of source.modules) {
        const newModule = await tx.courseModule.create({
          data: {
            courseId: course.id,
            title: courseModule.title,
            description: courseModule.description,
            sortOrder: courseModule.sortOrder,
          },
        });

        for (const lesson of courseModule.lessons) {
          await tx.courseLesson.create({
            data: {
              moduleId: newModule.id,
              title: lesson.title,
              slug: lesson.slug,
              description: lesson.description,
              lessonType: lesson.lessonType,
              sortOrder: lesson.sortOrder,
              durationMinutes: lesson.durationMinutes,
              textContent: lesson.textContent,
              vimeoVideoId: lesson.vimeoVideoId,
              downloadStorageKey: null,
              downloadFileName: null,
              recipeId: lesson.recipeId,
              recipeTitle: lesson.recipeTitle,
              recipeContent: lesson.recipeContent ?? Prisma.JsonNull,
              externalUrl: lesson.externalUrl,
              externalUrlLabel: lesson.externalUrlLabel,
            },
          });
        }
      }

      return tx.course.findUniqueOrThrow({
        where: { id: course.id },
        include: COURSE_INCLUDE,
      });
    });

    await syncCourseProduct(created.id);

    return userSuccess((await reloadAdminRecord(created.id)) ?? (await toAdminRecord(created)));
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return userFailure({
        code: "CONFLICT",
        message: "Slug-Konflikt beim Duplizieren.",
      });
    }

    return userFailure({
      code: "INTERNAL_ERROR",
      message: "Kurs konnte nicht dupliziert werden.",
    });
  }
}

export async function importCourseFromJson(
  payload: CourseImportPayload,
): Promise<UserServiceResult<AdminCourseRecord>> {
  try {
    const title = payload.course.title.trim();

    if (!title) {
      return userFailure({
        code: "VALIDATION_ERROR",
        message: "Kurstitel ist erforderlich.",
      });
    }

    const slug = await allocateUniqueSlug(
      payload.course.slug?.trim() || slugifyCourseTitle(title),
    );

    const created = await prisma.$transaction(async (tx) => {
      const course = await tx.course.create({
        data: {
          title,
          slug,
          subtitle: payload.course.subtitle?.trim() || null,
          shortDescription: payload.course.shortDescription?.trim() || null,
          description: payload.course.description?.trim() || null,
          prerequisites: payload.course.prerequisites?.trim() || null,
          requiredEquipment: payload.course.requiredEquipment?.trim() || null,
          learningGoals: serializeLearningGoals(payload.course.learningGoals ?? []),
          courseType: payload.course.courseType,
          status: "draft",
          certificateType: payload.course.certificateType ?? "participation",
          certificateOverride: payload.course.certificateOverride ?? false,
          estimatedMinutes: payload.course.estimatedMinutes ?? null,
          priceCents: payload.course.priceCents ?? null,
          priceCurrency: payload.course.priceCurrency ?? "EUR",
          featuredOnHomepage: payload.course.featuredOnHomepage ?? false,
          homepageSortOrder: payload.course.homepageSortOrder ?? 100,
          productId: null,
          publishedAt: null,
        },
      });

      for (const [moduleIndex, courseModule] of payload.modules.entries()) {
        const newModule = await tx.courseModule.create({
          data: {
            courseId: course.id,
            title: courseModule.title.trim(),
            description: courseModule.description?.trim() || null,
            sortOrder: courseModule.sortOrder ?? (moduleIndex + 1) * 10,
          },
        });

        for (const [lessonIndex, lesson] of courseModule.lessons.entries()) {
          const lessonSlug = (
            lesson.slug?.trim() || slugifyCourseTitle(lesson.title)
          ).toLowerCase();

          await tx.courseLesson.create({
            data: {
              moduleId: newModule.id,
              title: lesson.title.trim(),
              slug: lessonSlug,
              description: lesson.description?.trim() || null,
              lessonType: lesson.lessonType,
              sortOrder: lesson.sortOrder ?? (lessonIndex + 1) * 10,
              durationMinutes: lesson.durationMinutes ?? null,
              textContent: lesson.textContent?.trim() || null,
              vimeoVideoId: normalizeVimeoVideoId(lesson.vimeoVideoId),
              recipeTitle: lesson.recipeTitle?.trim() || null,
              recipeContent: lesson.recipeContent
                ? (lesson.recipeContent as Prisma.InputJsonValue)
                : Prisma.JsonNull,
              externalUrl: normalizeLessonExternalUrl(lesson.externalUrl),
              externalUrlLabel: lesson.externalUrlLabel?.trim() || null,
            },
          });
        }
      }

      return tx.course.findUniqueOrThrow({
        where: { id: course.id },
        include: COURSE_INCLUDE,
      });
    });

    await syncCourseProduct(created.id);

    return userSuccess((await reloadAdminRecord(created.id)) ?? (await toAdminRecord(created)));
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return userFailure({
        code: "CONFLICT",
        message: "Slug oder Lektions-Slug ist bereits vergeben.",
      });
    }

    return userFailure({
      code: "INTERNAL_ERROR",
      message: "Kursimport fehlgeschlagen.",
    });
  }
}

export async function deleteCourse(
  courseId: string,
): Promise<UserServiceResult<true>> {
  try {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { productId: true },
    });

    await prisma.course.delete({ where: { id: courseId } });

    // Kurs gelöscht → zugehöriges Verkaufsprodukt archivieren (nicht löschen).
    await archiveCourseProduct(course?.productId ?? null);

    return userSuccess(true);
  } catch {
    return userFailure({
      code: "INTERNAL_ERROR",
      message: "Kurs konnte nicht gelöscht werden.",
    });
  }
}

/**
 * Erzeugt/aktualisiert das Verkaufsprodukt eines Kurses auf Knopfdruck.
 * Für den Fall, dass ein Kurs noch kein (aktives) Verkaufsprodukt hat.
 */
export async function regenerateCourseSalesProduct(
  courseId: string,
): Promise<UserServiceResult<AdminCourseRecord>> {
  try {
    const existing = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true },
    });

    if (!existing) {
      return userFailure({
        code: "NOT_FOUND",
        message: "Kurs wurde nicht gefunden.",
      });
    }

    await syncCourseProduct(courseId);
    const record = await reloadAdminRecord(courseId);

    if (!record) {
      return userFailure({
        code: "NOT_FOUND",
        message: "Kurs wurde nicht gefunden.",
      });
    }

    return userSuccess(record);
  } catch {
    return userFailure({
      code: "INTERNAL_ERROR",
      message: "Verkaufsprodukt konnte nicht erzeugt werden.",
    });
  }
}

export async function createCourseModule(
  courseId: string,
  input: CreateModuleInput,
): Promise<UserServiceResult<CourseDetail>> {
  try {
    const title = input.title.trim();

    if (!title) {
      return userFailure({
        code: "VALIDATION_ERROR",
        message: "Modultitel ist erforderlich.",
      });
    }

    const maxOrder = await prisma.courseModule.aggregate({
      where: { courseId },
      _max: { sortOrder: true },
    });

    await prisma.courseModule.create({
      data: {
        courseId,
        title,
        description: input.description?.trim() || null,
        sortOrder: input.sortOrder ?? (maxOrder._max.sortOrder ?? 0) + 10,
      },
    });

    const course = await prisma.course.findUniqueOrThrow({
      where: { id: courseId },
      include: COURSE_INCLUDE,
    });

    return userSuccess(toCourseDetail(course));
  } catch {
    return userFailure({
      code: "INTERNAL_ERROR",
      message: "Modul konnte nicht angelegt werden.",
    });
  }
}

async function compactModuleSortOrders(courseId: string): Promise<void> {
  const modules = await prisma.courseModule.findMany({
    where: { courseId },
    orderBy: { sortOrder: "asc" },
  });

  if (modules.length === 0) {
    return;
  }

  await prisma.$transaction(
    modules.map((courseModule, index) =>
      prisma.courseModule.update({
        where: { id: courseModule.id },
        data: { sortOrder: (index + 1) * 10 },
      }),
    ),
  );
}

async function compactLessonSortOrders(moduleId: string): Promise<void> {
  const lessons = await prisma.courseLesson.findMany({
    where: { moduleId },
    orderBy: { sortOrder: "asc" },
  });

  if (lessons.length === 0) {
    return;
  }

  await prisma.$transaction(
    lessons.map((lesson, index) =>
      prisma.courseLesson.update({
        where: { id: lesson.id },
        data: { sortOrder: (index + 1) * 10 },
      }),
    ),
  );
}

async function syncCourseCertificateProof(
  courseId: string,
  proofType: CertificateProofType,
): Promise<void> {
  const course = await prisma.course.findUniqueOrThrow({
    where: { id: courseId },
    select: { courseType: true },
  });

  await prisma.course.update({
    where: { id: courseId },
    data: {
      certificateType: proofType,
      certificateOverride:
        course.courseType === "minikurs" && proofType === "achievement",
    },
  });
}

export async function updateCourseModule(
  moduleId: string,
  input: UpdateModuleInput,
): Promise<UserServiceResult<CourseDetail>> {
  try {
    const courseModule = await prisma.courseModule.update({
      where: { id: moduleId },
      data: {
        title: input.title?.trim(),
        description:
          input.description !== undefined
            ? input.description?.trim() || null
            : undefined,
        sortOrder: input.sortOrder,
      },
    });

    const course = await prisma.course.findUniqueOrThrow({
      where: { id: courseModule.courseId },
      include: COURSE_INCLUDE,
    });

    return userSuccess(toCourseDetail(course));
  } catch {
    return userFailure({
      code: "INTERNAL_ERROR",
      message: "Modul konnte nicht aktualisiert werden.",
    });
  }
}

export async function deleteCourseModule(
  moduleId: string,
): Promise<UserServiceResult<CourseDetail>> {
  try {
    const courseModule = await prisma.courseModule.delete({ where: { id: moduleId } });

    await compactModuleSortOrders(courseModule.courseId);

    const course = await prisma.course.findUniqueOrThrow({
      where: { id: courseModule.courseId },
      include: COURSE_INCLUDE,
    });

    return userSuccess(toCourseDetail(course));
  } catch {
    return userFailure({
      code: "INTERNAL_ERROR",
      message: "Modul konnte nicht gelöscht werden.",
    });
  }
}

export async function reorderCourseModules(
  courseId: string,
  moduleIds: string[],
): Promise<UserServiceResult<CourseDetail>> {
  try {
    await prisma.$transaction(
      moduleIds.map((id, index) =>
        prisma.courseModule.update({
          where: { id, courseId },
          data: { sortOrder: (index + 1) * 10 },
        }),
      ),
    );

    const course = await prisma.course.findUniqueOrThrow({
      where: { id: courseId },
      include: COURSE_INCLUDE,
    });

    return userSuccess(toCourseDetail(course));
  } catch {
    return userFailure({
      code: "INTERNAL_ERROR",
      message: "Modulreihenfolge konnte nicht gespeichert werden.",
    });
  }
}

export async function createCourseLesson(
  moduleId: string,
  input: CreateLessonInput,
): Promise<UserServiceResult<CourseDetail>> {
  try {
    const title = input.title.trim();

    if (!title) {
      return userFailure({
        code: "VALIDATION_ERROR",
        message: "Lektionstitel ist erforderlich.",
      });
    }

    const courseModule = await prisma.courseModule.findUnique({
      where: { id: moduleId },
    });

    if (!courseModule) {
      return userFailure({
        code: "NOT_FOUND",
        message: "Modul wurde nicht gefunden.",
      });
    }

    const slug = (
      input.slug?.trim() || slugifyCourseTitle(title)
    ).toLowerCase();

    const maxOrder = await prisma.courseLesson.aggregate({
      where: { moduleId },
      _max: { sortOrder: true },
    });

    if (!isValidLessonExternalUrl(input.externalUrl)) {
      return userFailure({
        code: "VALIDATION_ERROR",
        message: "Der Ressourcen-Link muss mit http:// oder https:// beginnen.",
      });
    }

    await prisma.courseLesson.create({
      data: {
        moduleId,
        title,
        slug,
        description: input.description?.trim() || null,
        lessonType: input.lessonType,
        sortOrder: input.sortOrder ?? (maxOrder._max.sortOrder ?? 0) + 10,
        durationMinutes: input.durationMinutes ?? null,
        textContent: input.textContent?.trim() || null,
        vimeoVideoId: normalizeVimeoVideoId(input.vimeoVideoId),
        recipeId: input.recipeId ?? null,
        recipeTitle: input.recipeTitle?.trim() || null,
        recipeContent: input.recipeContent
          ? (input.recipeContent as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        externalUrl: normalizeLessonExternalUrl(input.externalUrl),
        externalUrlLabel: input.externalUrlLabel?.trim() || null,
      },
    });

    if (input.lessonType === "certificate") {
      const courseRecord = await prisma.course.findUniqueOrThrow({
        where: { id: courseModule.courseId },
        select: { courseType: true },
      });
      const proofType: CertificateProofType =
        input.certificateProofType ??
        (courseRecord.courseType === "zertifikatskurs"
          ? "achievement"
          : "participation");

      await syncCourseCertificateProof(courseModule.courseId, proofType);
    }

    const course = await prisma.course.findUniqueOrThrow({
      where: { id: courseModule.courseId },
      include: COURSE_INCLUDE,
    });

    return userSuccess(toCourseDetail(course));
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return userFailure({
        code: "CONFLICT",
        message: "Lektions-Slug ist in diesem Modul bereits vergeben.",
      });
    }

    return userFailure({
      code: "INTERNAL_ERROR",
      message: "Lektion konnte nicht angelegt werden.",
    });
  }
}

export async function updateCourseLesson(
  lessonId: string,
  input: UpdateLessonInput,
): Promise<UserServiceResult<CourseDetail>> {
  try {
    if (
      input.externalUrl !== undefined &&
      !isValidLessonExternalUrl(input.externalUrl)
    ) {
      return userFailure({
        code: "VALIDATION_ERROR",
        message: "Der Ressourcen-Link muss mit http:// oder https:// beginnen.",
      });
    }

    const lesson = await prisma.courseLesson.update({
      where: { id: lessonId },
      data: {
        title: input.title?.trim(),
        slug: input.slug?.trim().toLowerCase(),
        description:
          input.description !== undefined
            ? input.description?.trim() || null
            : undefined,
        lessonType: input.lessonType,
        sortOrder: input.sortOrder,
        durationMinutes: input.durationMinutes,
        textContent:
          input.textContent !== undefined
            ? input.textContent?.trim() || null
            : undefined,
        vimeoVideoId:
          input.vimeoVideoId !== undefined
            ? normalizeVimeoVideoId(input.vimeoVideoId)
            : undefined,
        recipeId: input.recipeId,
        recipeTitle:
          input.recipeTitle !== undefined
            ? input.recipeTitle?.trim() || null
            : undefined,
        recipeContent:
          input.recipeContent !== undefined
            ? input.recipeContent
              ? (input.recipeContent as Prisma.InputJsonValue)
              : Prisma.JsonNull
            : undefined,
        externalUrl:
          input.externalUrl !== undefined
            ? normalizeLessonExternalUrl(input.externalUrl)
            : undefined,
        externalUrlLabel:
          input.externalUrlLabel !== undefined
            ? input.externalUrlLabel?.trim() || null
            : undefined,
        downloadStorageKey: input.downloadStorageKey,
        downloadFileName: input.downloadFileName,
      },
      include: { module: true },
    });

    const effectiveLessonType = input.lessonType ?? lesson.lessonType;

    if (effectiveLessonType === "certificate") {
      const courseRecord = await prisma.course.findUniqueOrThrow({
        where: { id: lesson.module.courseId },
        select: { courseType: true, certificateType: true },
      });
      const proofType: CertificateProofType =
        input.certificateProofType ??
        (courseRecord.certificateType === "achievement" ||
        courseRecord.certificateType === "masterclass"
          ? "achievement"
          : courseRecord.courseType === "zertifikatskurs"
            ? "achievement"
            : "participation");

      await syncCourseCertificateProof(lesson.module.courseId, proofType);
    }

    const course = await prisma.course.findUniqueOrThrow({
      where: { id: lesson.module.courseId },
      include: COURSE_INCLUDE,
    });

    return userSuccess(toCourseDetail(course));
  } catch {
    return userFailure({
      code: "INTERNAL_ERROR",
      message: "Lektion konnte nicht aktualisiert werden.",
    });
  }
}

export async function deleteCourseLesson(
  lessonId: string,
): Promise<UserServiceResult<CourseDetail>> {
  try {
    const lesson = await prisma.courseLesson.delete({
      where: { id: lessonId },
      include: { module: true },
    });

    await compactLessonSortOrders(lesson.moduleId);

    const course = await prisma.course.findUniqueOrThrow({
      where: { id: lesson.module.courseId },
      include: COURSE_INCLUDE,
    });

    return userSuccess(toCourseDetail(course));
  } catch {
    return userFailure({
      code: "INTERNAL_ERROR",
      message: "Lektion konnte nicht gelöscht werden.",
    });
  }
}

export async function reorderCourseLessons(
  moduleId: string,
  lessonIds: string[],
): Promise<UserServiceResult<CourseDetail>> {
  try {
    const courseModule = await prisma.courseModule.findUniqueOrThrow({
      where: { id: moduleId },
    });

    await prisma.$transaction(
      lessonIds.map((id, index) =>
        prisma.courseLesson.update({
          where: { id, moduleId },
          data: { sortOrder: (index + 1) * 10 },
        }),
      ),
    );

    const course = await prisma.course.findUniqueOrThrow({
      where: { id: courseModule.courseId },
      include: COURSE_INCLUDE,
    });

    return userSuccess(toCourseDetail(course));
  } catch {
    return userFailure({
      code: "INTERNAL_ERROR",
      message: "Lektionsreihenfolge konnte nicht gespeichert werden.",
    });
  }
}

export async function listMembershipCourseRules(): Promise<
  MembershipCourseRuleEntry[]
> {
  const rows = await prisma.membershipCourseRule.findMany({
    include: { course: { select: { title: true } } },
    orderBy: [{ membershipRole: "asc" }, { course: { title: "asc" } }],
  });

  return rows.map((row) => ({
    id: row.id,
    membershipRole: row.membershipRole,
    courseId: row.courseId,
    courseTitle: row.course.title,
    billingPeriod: row.billingPeriod,
    active: row.active,
    note: row.note,
  }));
}

export async function upsertMembershipCourseRule(input: {
  membershipRole: MembershipRole;
  courseId: string;
  billingPeriod?: BillingPeriod | null;
  active?: boolean;
  note?: string | null;
}): Promise<UserServiceResult<MembershipCourseRuleEntry>> {
  try {
    const row = await prisma.membershipCourseRule.upsert({
      where: {
        membershipRole_courseId: {
          membershipRole: input.membershipRole,
          courseId: input.courseId,
        },
      },
      create: {
        membershipRole: input.membershipRole,
        courseId: input.courseId,
        billingPeriod: input.billingPeriod ?? "yearly",
        active: input.active ?? true,
        note: input.note?.trim() || null,
      },
      update: {
        billingPeriod: input.billingPeriod ?? undefined,
        active: input.active,
        note: input.note?.trim() || null,
      },
      include: { course: { select: { title: true } } },
    });

    return userSuccess({
      id: row.id,
      membershipRole: row.membershipRole,
      courseId: row.courseId,
      courseTitle: row.course.title,
      billingPeriod: row.billingPeriod,
      active: row.active,
      note: row.note,
    });
  } catch {
    return userFailure({
      code: "INTERNAL_ERROR",
      message: "Mitgliedschaftsregel konnte nicht gespeichert werden.",
    });
  }
}

export async function deleteMembershipCourseRule(
  ruleId: string,
): Promise<UserServiceResult<true>> {
  try {
    await prisma.membershipCourseRule.delete({ where: { id: ruleId } });
    return userSuccess(true);
  } catch {
    return userFailure({
      code: "INTERNAL_ERROR",
      message: "Mitgliedschaftsregel konnte nicht gelöscht werden.",
    });
  }
}
