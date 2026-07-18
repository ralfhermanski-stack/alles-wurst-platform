/**
 * @file course-group-service.ts
 * @purpose CRUD für Kursgruppen und Untergruppen.
 */

import type { CourseGroup, CourseSubgroup, Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import {
  userFailure,
  userSuccess,
  type UserServiceResult,
} from "@/lib/users/user-errors";
import { slugifyCourseTitle } from "@/lib/courses/course-types";

import { saveCourseGroupImage } from "./course-group-storage";
import type {
  CourseGroupRecord,
  CourseSubgroupRecord,
  CreateCourseGroupInput,
  CreateCourseSubgroupInput,
  LearningPathAssignmentInput,
  LearningPathAssignmentRecord,
  PublicCourseGroupCard,
  UpdateCourseGroupInput,
  UpdateCourseSubgroupInput,
} from "./course-group-types";

function slugifyGroupName(value: string): string {
  return slugifyCourseTitle(value) || "gruppe";
}

async function allocateUniqueGroupSlug(baseSlug: string): Promise<string> {
  let candidate = baseSlug;
  let counter = 2;

  while (await prisma.courseGroup.findUnique({ where: { slug: candidate } })) {
    candidate = `${baseSlug}-${counter}`;
    counter += 1;
  }

  return candidate;
}

async function allocateUniqueSubgroupSlug(
  courseGroupId: string,
  baseSlug: string,
): Promise<string> {
  let candidate = baseSlug;
  let counter = 2;

  while (
    await prisma.courseSubgroup.findFirst({
      where: { courseGroupId, slug: candidate },
    })
  ) {
    candidate = `${baseSlug}-${counter}`;
    counter += 1;
  }

  return candidate;
}

function mapGroup(
  group: CourseGroup & {
    _count?: { subgroups: number; courses: number; learningPathAssignments?: number };
  },
): CourseGroupRecord {
  return {
    id: group.id,
    name: group.name,
    slug: group.slug,
    shortDescription: group.shortDescription,
    levelLabel: group.levelLabel,
    hasImage: Boolean(group.imageStorageKey),
    imageFileName: group.imageFileName,
    sortOrder: group.sortOrder,
    isActive: group.isActive,
    subgroupCount: group._count?.subgroups ?? 0,
    courseCount:
      group._count?.learningPathAssignments ?? group._count?.courses ?? 0,
    createdAt: group.createdAt.toISOString(),
    updatedAt: group.updatedAt.toISOString(),
  };
}

function mapSubgroup(
  subgroup: CourseSubgroup & {
    courseGroup: { name: string; slug: string };
    _count?: { courses: number; learningPathAssignments?: number };
  },
): CourseSubgroupRecord {
  return {
    id: subgroup.id,
    courseGroupId: subgroup.courseGroupId,
    name: subgroup.name,
    slug: subgroup.slug,
    shortDescription: subgroup.shortDescription,
    hasImage: Boolean(subgroup.imageStorageKey),
    imageFileName: subgroup.imageFileName,
    sortOrder: subgroup.sortOrder,
    isActive: subgroup.isActive,
    courseCount:
      subgroup._count?.learningPathAssignments ?? subgroup._count?.courses ?? 0,
    groupName: subgroup.courseGroup.name,
    groupSlug: subgroup.courseGroup.slug,
    createdAt: subgroup.createdAt.toISOString(),
    updatedAt: subgroup.updatedAt.toISOString(),
  };
}

export async function listCourseGroups(options?: {
  activeOnly?: boolean;
}): Promise<CourseGroupRecord[]> {
  const groups = await prisma.courseGroup.findMany({
    where: options?.activeOnly ? { isActive: true } : undefined,
    include: {
      _count: {
        select: {
          subgroups: true,
          courses: true,
          learningPathAssignments: true,
        },
      },
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return groups.map(mapGroup);
}

export async function listCourseSubgroups(options?: {
  courseGroupId?: string;
  activeOnly?: boolean;
}): Promise<CourseSubgroupRecord[]> {
  const where: Prisma.CourseSubgroupWhereInput = {};

  if (options?.courseGroupId) {
    where.courseGroupId = options.courseGroupId;
  }

  if (options?.activeOnly) {
    where.isActive = true;
  }

  const subgroups = await prisma.courseSubgroup.findMany({
    where,
    include: {
      courseGroup: { select: { name: true, slug: true } },
      _count: {
        select: { courses: true, learningPathAssignments: true },
      },
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return subgroups.map(mapSubgroup);
}

export async function listPublicCourseGroups(): Promise<PublicCourseGroupCard[]> {
  const groups = await prisma.courseGroup.findMany({
    where: { isActive: true },
    include: {
      subgroups: {
        where: { isActive: true },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      },
      _count: {
        select: {
          courses: { where: { status: "published" } },
          learningPathAssignments: {
            where: { course: { status: "published" } },
          },
        },
      },
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return groups.map((group) => ({
    id: group.id,
    name: group.name,
    slug: group.slug,
    shortDescription: group.shortDescription,
    levelLabel: group.levelLabel,
    hasImage: Boolean(group.imageStorageKey),
    sortOrder: group.sortOrder,
    courseCount:
      group._count.learningPathAssignments || group._count.courses,
    subgroupCount: group.subgroups.length,
    subgroups: group.subgroups.map((subgroup) => ({
      id: subgroup.id,
      name: subgroup.name,
      slug: subgroup.slug,
      shortDescription: subgroup.shortDescription,
      hasImage: Boolean(subgroup.imageStorageKey),
      sortOrder: subgroup.sortOrder,
    })),
  }));
}

export async function getCourseGroupBySlug(
  slug: string,
  options?: { activeOnly?: boolean },
): Promise<
  | (CourseGroupRecord & {
      subgroups: Array<{
        id: string;
        name: string;
        slug: string;
        shortDescription: string | null;
        hasImage: boolean;
        sortOrder: number;
      }>;
    })
  | null
> {
  const group = await prisma.courseGroup.findFirst({
    where: {
      slug,
      ...(options?.activeOnly ? { isActive: true } : {}),
    },
    include: {
      _count: {
        select: {
          subgroups: true,
          courses: true,
          learningPathAssignments: true,
        },
      },
      subgroups: {
        where: options?.activeOnly ? { isActive: true } : undefined,
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      },
    },
  });

  if (!group) {
    return null;
  }

  return {
    ...mapGroup(group),
    subgroups: group.subgroups.map((subgroup) => ({
      id: subgroup.id,
      name: subgroup.name,
      slug: subgroup.slug,
      shortDescription: subgroup.shortDescription,
      hasImage: Boolean(subgroup.imageStorageKey),
      sortOrder: subgroup.sortOrder,
    })),
  };
}

export async function getCourseSubgroupBySlugs(
  groupSlug: string,
  subgroupSlug: string,
  options?: { activeOnly?: boolean },
): Promise<
  | (CourseSubgroupRecord & {
      group: CourseGroupRecord;
    })
  | null
> {
  const subgroup = await prisma.courseSubgroup.findFirst({
    where: {
      slug: subgroupSlug,
      courseGroup: {
        slug: groupSlug,
        ...(options?.activeOnly ? { isActive: true } : {}),
      },
      ...(options?.activeOnly ? { isActive: true } : {}),
    },
    include: {
      courseGroup: {
        include: {
          _count: {
            select: {
              subgroups: true,
              courses: true,
              learningPathAssignments: true,
            },
          },
        },
      },
      _count: {
        select: { courses: true, learningPathAssignments: true },
      },
    },
  });

  if (!subgroup) {
    return null;
  }

  return {
    ...mapSubgroup(subgroup),
    group: mapGroup(subgroup.courseGroup),
  };
}

export async function getCourseGroupImageMeta(groupId: string): Promise<{
  storageKey: string | null;
  title: string;
}> {
  const group = await prisma.courseGroup.findUnique({
    where: { id: groupId },
    select: { imageStorageKey: true, name: true },
  });

  return {
    storageKey: group?.imageStorageKey ?? null,
    title: group?.name ?? "Kursbereich",
  };
}

export async function getCourseSubgroupImageMeta(subgroupId: string): Promise<{
  storageKey: string | null;
  title: string;
}> {
  const subgroup = await prisma.courseSubgroup.findUnique({
    where: { id: subgroupId },
    select: { imageStorageKey: true, name: true },
  });

  return {
    storageKey: subgroup?.imageStorageKey ?? null,
    title: subgroup?.name ?? "Untergruppe",
  };
}

export async function createCourseGroup(
  input: CreateCourseGroupInput,
): Promise<UserServiceResult<CourseGroupRecord>> {
  try {
    const name = input.name.trim();

    if (!name) {
      return userFailure({
        code: "VALIDATION_ERROR",
        message: "Name ist erforderlich.",
      });
    }

    const slug = await allocateUniqueGroupSlug(
      slugifyGroupName(input.slug?.trim() || name),
    );

    const group = await prisma.courseGroup.create({
      data: {
        name,
        slug,
        shortDescription: input.shortDescription?.trim() || null,
        levelLabel: input.levelLabel?.trim() || null,
        sortOrder: input.sortOrder ?? 100,
        isActive: input.isActive ?? true,
      },
      include: {
        _count: { select: { subgroups: true, courses: true } },
      },
    });

    return userSuccess(mapGroup(group));
  } catch {
    return userFailure({
      code: "INTERNAL_ERROR",
      message: "Hauptgruppe konnte nicht erstellt werden.",
    });
  }
}

export async function updateCourseGroup(
  groupId: string,
  input: UpdateCourseGroupInput,
): Promise<UserServiceResult<CourseGroupRecord>> {
  try {
    const existing = await prisma.courseGroup.findUnique({
      where: { id: groupId },
    });

    if (!existing) {
      return userFailure({
        code: "NOT_FOUND",
        message: "Hauptgruppe wurde nicht gefunden.",
      });
    }

    let nextSlug: string | undefined;

    if (input.slug !== undefined) {
      const base = slugifyGroupName(input.slug.trim() || existing.name);

      if (base !== existing.slug) {
        nextSlug = await allocateUniqueGroupSlug(base);
      } else {
        nextSlug = existing.slug;
      }
    }

    const group = await prisma.courseGroup.update({
      where: { id: groupId },
      data: {
        name: input.name?.trim(),
        slug: nextSlug,
        shortDescription:
          input.shortDescription !== undefined
            ? input.shortDescription?.trim() || null
            : undefined,
        levelLabel:
          input.levelLabel !== undefined
            ? input.levelLabel?.trim() || null
            : undefined,
        sortOrder: input.sortOrder,
        isActive: input.isActive,
      },
      include: {
        _count: { select: { subgroups: true, courses: true } },
      },
    });

    return userSuccess(mapGroup(group));
  } catch {
    return userFailure({
      code: "INTERNAL_ERROR",
      message: "Hauptgruppe konnte nicht aktualisiert werden.",
    });
  }
}

export async function deleteCourseGroup(
  groupId: string,
): Promise<UserServiceResult<true>> {
  try {
    const courseCount = await prisma.course.count({
      where: { courseGroupId: groupId },
    });

    if (courseCount > 0) {
      return userFailure({
        code: "CONFLICT",
        message:
          "Hauptgruppe kann nicht gelöscht werden, solange Kurse zugeordnet sind. Bitte deaktivieren.",
      });
    }

    await prisma.courseGroup.delete({ where: { id: groupId } });

    return userSuccess(true);
  } catch {
    return userFailure({
      code: "INTERNAL_ERROR",
      message: "Hauptgruppe konnte nicht gelöscht werden.",
    });
  }
}

export async function updateCourseGroupImage(
  groupId: string,
  fileName: string,
  bytes: Uint8Array,
): Promise<UserServiceResult<CourseGroupRecord>> {
  try {
    const saved = await saveCourseGroupImage(groupId, "group", fileName, bytes);

    const group = await prisma.courseGroup.update({
      where: { id: groupId },
      data: {
        imageStorageKey: saved.storageKey,
        imageFileName: saved.fileName,
      },
      include: {
        _count: { select: { subgroups: true, courses: true } },
      },
    });

    return userSuccess(mapGroup(group));
  } catch {
    return userFailure({
      code: "INTERNAL_ERROR",
      message: "Bild konnte nicht gespeichert werden.",
    });
  }
}

export async function createCourseSubgroup(
  input: CreateCourseSubgroupInput,
): Promise<UserServiceResult<CourseSubgroupRecord>> {
  try {
    const name = input.name.trim();

    if (!name) {
      return userFailure({
        code: "VALIDATION_ERROR",
        message: "Name ist erforderlich.",
      });
    }

    const group = await prisma.courseGroup.findUnique({
      where: { id: input.courseGroupId },
    });

    if (!group) {
      return userFailure({
        code: "NOT_FOUND",
        message: "Hauptgruppe wurde nicht gefunden.",
      });
    }

    const slug = await allocateUniqueSubgroupSlug(
      input.courseGroupId,
      slugifyGroupName(input.slug?.trim() || name),
    );

    const subgroup = await prisma.courseSubgroup.create({
      data: {
        courseGroupId: input.courseGroupId,
        name,
        slug,
        shortDescription: input.shortDescription?.trim() || null,
        sortOrder: input.sortOrder ?? 100,
        isActive: input.isActive ?? true,
      },
      include: {
        courseGroup: { select: { name: true, slug: true } },
        _count: { select: { courses: true } },
      },
    });

    return userSuccess(mapSubgroup(subgroup));
  } catch {
    return userFailure({
      code: "INTERNAL_ERROR",
      message: "Untergruppe konnte nicht erstellt werden.",
    });
  }
}

export async function updateCourseSubgroup(
  subgroupId: string,
  input: UpdateCourseSubgroupInput,
): Promise<UserServiceResult<CourseSubgroupRecord>> {
  try {
    const existing = await prisma.courseSubgroup.findUnique({
      where: { id: subgroupId },
    });

    if (!existing) {
      return userFailure({
        code: "NOT_FOUND",
        message: "Untergruppe wurde nicht gefunden.",
      });
    }

    const targetGroupId = input.courseGroupId ?? existing.courseGroupId;

    if (input.courseGroupId && input.courseGroupId !== existing.courseGroupId) {
      const courseCount = await prisma.course.count({
        where: { courseSubgroupId: subgroupId },
      });

      if (courseCount > 0) {
        return userFailure({
          code: "CONFLICT",
          message:
            "Untergruppe mit zugeordneten Kursen kann nicht der Hauptgruppe wechseln.",
        });
      }
    }

    let nextSlug: string | undefined;

    if (input.slug !== undefined) {
      const base = slugifyGroupName(input.slug.trim() || existing.name);

      if (base !== existing.slug || targetGroupId !== existing.courseGroupId) {
        nextSlug = await allocateUniqueSubgroupSlug(targetGroupId, base);
      } else {
        nextSlug = existing.slug;
      }
    }

    const subgroup = await prisma.courseSubgroup.update({
      where: { id: subgroupId },
      data: {
        courseGroupId: input.courseGroupId,
        name: input.name?.trim(),
        slug: nextSlug,
        shortDescription:
          input.shortDescription !== undefined
            ? input.shortDescription?.trim() || null
            : undefined,
        sortOrder: input.sortOrder,
        isActive: input.isActive,
      },
      include: {
        courseGroup: { select: { name: true, slug: true } },
        _count: { select: { courses: true } },
      },
    });

    return userSuccess(mapSubgroup(subgroup));
  } catch {
    return userFailure({
      code: "INTERNAL_ERROR",
      message: "Untergruppe konnte nicht aktualisiert werden.",
    });
  }
}

export async function deleteCourseSubgroup(
  subgroupId: string,
): Promise<UserServiceResult<true>> {
  try {
    const courseCount = await prisma.course.count({
      where: { courseSubgroupId: subgroupId },
    });

    if (courseCount > 0) {
      return userFailure({
        code: "CONFLICT",
        message:
          "Untergruppe kann nicht gelöscht werden, solange Kurse zugeordnet sind. Bitte deaktivieren.",
      });
    }

    await prisma.courseSubgroup.delete({ where: { id: subgroupId } });

    return userSuccess(true);
  } catch {
    return userFailure({
      code: "INTERNAL_ERROR",
      message: "Untergruppe konnte nicht gelöscht werden.",
    });
  }
}

export async function updateCourseSubgroupImage(
  subgroupId: string,
  fileName: string,
  bytes: Uint8Array,
): Promise<UserServiceResult<CourseSubgroupRecord>> {
  try {
    const saved = await saveCourseGroupImage(
      subgroupId,
      "subgroup",
      fileName,
      bytes,
    );

    const subgroup = await prisma.courseSubgroup.update({
      where: { id: subgroupId },
      data: {
        imageStorageKey: saved.storageKey,
        imageFileName: saved.fileName,
      },
      include: {
        courseGroup: { select: { name: true, slug: true } },
        _count: { select: { courses: true } },
      },
    });

    return userSuccess(mapSubgroup(subgroup));
  } catch {
    return userFailure({
      code: "INTERNAL_ERROR",
      message: "Bild konnte nicht gespeichert werden.",
    });
  }
}

export async function validateCourseGroupAssignment(
  courseGroupId: string | null | undefined,
  courseSubgroupId: string | null | undefined,
  options?: { requireActive?: boolean },
): Promise<UserServiceResult<true>> {
  if (!courseGroupId) {
    return userFailure({
      code: "VALIDATION_ERROR",
      message: "Eine Hauptgruppe ist erforderlich.",
    });
  }

  const group = await prisma.courseGroup.findUnique({
    where: { id: courseGroupId },
  });

  if (!group) {
    return userFailure({
      code: "VALIDATION_ERROR",
      message: "Die gewählte Hauptgruppe existiert nicht.",
    });
  }

  if (options?.requireActive && !group.isActive) {
    return userFailure({
      code: "VALIDATION_ERROR",
      message: "Die gewählte Hauptgruppe ist inaktiv.",
    });
  }

  if (!courseSubgroupId) {
    return userSuccess(true);
  }

  const subgroup = await prisma.courseSubgroup.findFirst({
    where: { id: courseSubgroupId, courseGroupId },
  });

  if (!subgroup) {
    return userFailure({
      code: "VALIDATION_ERROR",
      message: "Die Untergruppe gehört nicht zur gewählten Hauptgruppe.",
    });
  }

  if (options?.requireActive && !subgroup.isActive) {
    return userFailure({
      code: "VALIDATION_ERROR",
      message: "Die gewählte Untergruppe ist inaktiv.",
    });
  }

  return userSuccess(true);
}

function mapLearningPathAssignment(
  assignment: {
    id: string;
    courseGroupId: string;
    courseSubgroupId: string | null;
    sortOrder: number;
    isPrimary: boolean;
    courseGroup: { id: string; name: string; slug: string; isActive: boolean };
    courseSubgroup: {
      id: string;
      name: string;
      slug: string;
      courseGroupId: string;
      isActive: boolean;
    } | null;
  },
): LearningPathAssignmentRecord {
  return {
    id: assignment.id,
    courseGroupId: assignment.courseGroupId,
    courseSubgroupId: assignment.courseSubgroupId,
    sortOrder: assignment.sortOrder,
    isPrimary: assignment.isPrimary,
    group: {
      id: assignment.courseGroup.id,
      name: assignment.courseGroup.name,
      slug: assignment.courseGroup.slug,
      isActive: assignment.courseGroup.isActive,
    },
    subgroup: assignment.courseSubgroup
      ? {
          id: assignment.courseSubgroup.id,
          name: assignment.courseSubgroup.name,
          slug: assignment.courseSubgroup.slug,
          courseGroupId: assignment.courseSubgroup.courseGroupId,
          isActive: assignment.courseSubgroup.isActive,
        }
      : null,
  };
}

const LEARNING_PATH_ASSIGNMENT_INCLUDE = {
  courseGroup: {
    select: { id: true, name: true, slug: true, isActive: true },
  },
  courseSubgroup: {
    select: {
      id: true,
      name: true,
      slug: true,
      courseGroupId: true,
      isActive: true,
    },
  },
} as const;

export async function listCourseLearningPathAssignments(
  courseId: string,
): Promise<LearningPathAssignmentRecord[]> {
  const assignments = await prisma.courseLearningPathAssignment.findMany({
    where: { courseId },
    include: LEARNING_PATH_ASSIGNMENT_INCLUDE,
    orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
  });

  return assignments.map(mapLearningPathAssignment);
}

export async function syncCourseLearningPathAssignments(
  courseId: string,
  assignments: LearningPathAssignmentInput[],
  options?: { requireActive?: boolean },
): Promise<
  UserServiceResult<{
    primaryGroupId: string | null;
    primarySubgroupId: string | null;
    records: LearningPathAssignmentRecord[];
  }>
> {
  const normalized = assignments
    .map((assignment, index) => ({
      courseGroupId: assignment.courseGroupId.trim(),
      courseSubgroupId: assignment.courseSubgroupId?.trim() || null,
      sortOrder: assignment.sortOrder ?? (index + 1) * 100,
      isPrimary: assignment.isPrimary ?? false,
    }))
    .filter((assignment) => assignment.courseGroupId);

  if (normalized.length === 0) {
    await prisma.$transaction([
      prisma.courseLearningPathAssignment.deleteMany({ where: { courseId } }),
      prisma.course.update({
        where: { id: courseId },
        data: { courseGroupId: null, courseSubgroupId: null },
      }),
    ]);

    return userSuccess({
      primaryGroupId: null,
      primarySubgroupId: null,
      records: [],
    });
  }

  const groupIds = normalized.map((assignment) => assignment.courseGroupId);
  const uniqueGroupIds = new Set(groupIds);

  if (uniqueGroupIds.size !== groupIds.length) {
    return userFailure({
      code: "VALIDATION_ERROR",
      message: "Jede Kursgruppe darf nur einmal zugeordnet werden.",
    });
  }

  let primaryIndex = normalized.findIndex((assignment) => assignment.isPrimary);

  if (primaryIndex < 0) {
    primaryIndex = 0;
  }

  for (const assignment of normalized) {
    const check = await validateCourseGroupAssignment(
      assignment.courseGroupId,
      assignment.courseSubgroupId,
      options,
    );

    if (!check.success) {
      return check as UserServiceResult<{
        primaryGroupId: string | null;
        primarySubgroupId: string | null;
        records: LearningPathAssignmentRecord[];
      }>;
    }
  }

  const primary = normalized[primaryIndex];

  await prisma.$transaction([
    prisma.courseLearningPathAssignment.deleteMany({ where: { courseId } }),
    prisma.courseLearningPathAssignment.createMany({
      data: normalized.map((assignment, index) => ({
        courseId,
        courseGroupId: assignment.courseGroupId,
        courseSubgroupId: assignment.courseSubgroupId,
        sortOrder: assignment.sortOrder,
        isPrimary: index === primaryIndex,
      })),
    }),
    prisma.course.update({
      where: { id: courseId },
      data: {
        courseGroupId: primary.courseGroupId,
        courseSubgroupId: primary.courseSubgroupId,
      },
    }),
  ]);

  const records = await listCourseLearningPathAssignments(courseId);

  return userSuccess({
    primaryGroupId: primary.courseGroupId,
    primarySubgroupId: primary.courseSubgroupId,
    records,
  });
}
