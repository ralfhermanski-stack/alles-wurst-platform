/**
 * @file forum-service.ts
 * @purpose Foren: Auto-Provisioning, Zugriff, Admin-CRUD, Listing.
 */

import type {
  Forum,
  ForumPurpose,
  ForumReadAccess,
  ForumType,
  Prisma,
} from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import {
  userFailure,
  userSuccess,
  type UserServiceResult,
} from "@/lib/users/user-errors";
import { hasActiveCourseAccess } from "@/lib/courses/course-access-service";
import { slugifyCourseTitle } from "@/lib/courses/course-types";

import { hasAnyMiniCourseAccess } from "./forum-access-helpers";
import {
  describeForumReadRule,
  describeForumWriteRule,
  FORUM_PERMISSION_KIND_LABELS,
  getForumAccessBadge,
} from "./forum-labels";
import { permissionKindFromForum } from "./forum-permission-kinds";
import {
  canReadForum,
  canWriteForum,
  loadForumPermissionContext,
} from "./forum-permissions";
import {
  isMiniCourseGlobalForumsEnabled,
  setMiniCourseGlobalForumsEnabled,
} from "./system-settings-service";
import type {
  AdminForumEntry,
  CommunityForumEntry,
  CourseForumGroup,
  CreateForumInput,
  ForumEntry,
  UpdateForumInput,
} from "./forum-types";
import {
  normalizeCreateForumInput,
  normalizeUpdateForumInput,
  validateForumCourseAssignment,
  validateParentForumAssignment,
} from "./forum-validation";

export {
  getCommunityOverview,
  getVisibleForumsForUser,
} from "./forum-community-service";

export { hasAnyMiniCourseAccess };

const COURSE_FORUM_TEMPLATES: Array<{
  purpose: ForumPurpose;
  titleSuffix: string;
  sortOrder: number;
}> = [
  { purpose: "introduction", titleSuffix: "Vorstellungsforum", sortOrder: 10 },
  { purpose: "qa", titleSuffix: "Fragen und Antworten", sortOrder: 20 },
  { purpose: "improvements", titleSuffix: "Verbesserungen", sortOrder: 30 },
];

const KNOWN_MINI_COURSE_FORUM_SLUGS = new Set([
  "minikurse-vorstellungsforum",
  "minikurse-fragen-und-antworten",
  "minikurse-verbesserungen",
]);

const MINI_COURSE_GLOBAL_FORUMS: Array<{
  purpose: ForumPurpose;
  title: string;
  slug: string;
  sortOrder: number;
}> = [
  {
    purpose: "introduction",
    title: "Minikurse – Vorstellungsforum",
    slug: "minikurse-vorstellungsforum",
    sortOrder: 10,
  },
  {
    purpose: "qa",
    title: "Minikurse – Fragen und Antworten",
    slug: "minikurse-fragen-und-antworten",
    sortOrder: 20,
  },
  {
    purpose: "improvements",
    title: "Minikurse – Verbesserungen",
    slug: "minikurse-verbesserungen",
    sortOrder: 30,
  },
];

function defaultReadAccessForType(forumType: ForumType): ForumReadAccess {
  switch (forumType) {
    case "course":
      return "course_access";
    case "mini_course_global":
      return "mini_course_access";
    case "membership":
      return "membership";
    default:
      return "registered";
  }
}

function buildCourseForumSlug(courseSlug: string, purpose: ForumPurpose): string {
  const suffix =
    purpose === "introduction"
      ? "vorstellungsforum"
      : purpose === "qa"
        ? "fragen-und-antworten"
        : "verbesserungen";

  return `${courseSlug}-${suffix}`;
}

async function getForumCounts(forumId: string): Promise<{
  threadCount: number;
  postCount: number;
}> {
  if (
    typeof prisma.forumThread?.count !== "function" ||
    typeof prisma.forumPost?.count !== "function"
  ) {
    return { threadCount: 0, postCount: 0 };
  }

  try {
    const [threadCount, postCount] = await Promise.all([
      prisma.forumThread.count({ where: { forumId } }),
      prisma.forumPost.count({
        where: { thread: { forumId } },
      }),
    ]);

    return { threadCount, postCount };
  } catch {
    return { threadCount: 0, postCount: 0 };
  }
}

async function toForumEntry(
  forum: Forum & { course?: { title: string } | null },
  options: { includeCounts?: boolean } = {},
): Promise<ForumEntry> {
  const includeCounts = options.includeCounts ?? true;
  const forumCounts = includeCounts
    ? await getForumCounts(forum.id)
    : { threadCount: 0, postCount: 0 };

  return {
    id: forum.id,
    title: forum.title,
    slug: forum.slug,
    description: forum.description,
    forumType: forum.forumType,
    forumPurpose: forum.forumPurpose,
    readAccess: forum.readAccess ?? defaultReadAccessForType(forum.forumType),
    writeEnabled: forum.writeEnabled ?? true,
    requiredMembershipRole: forum.requiredMembershipRole ?? null,
    courseId: forum.courseId,
    courseTitle: forum.course?.title ?? null,
    parentForumId: forum.parentForumId ?? null,
    isActive: forum.isActive,
    sortOrder: forum.sortOrder,
    threadCount: forumCounts.threadCount,
    postCount: forumCounts.postCount,
    readRuleLabel: describeForumReadRule({
      forumType: forum.forumType,
      readAccess: forum.readAccess,
      requiredMembershipRole: forum.requiredMembershipRole,
      courseTitle: forum.course?.title ?? null,
    }),
    writeRuleLabel: describeForumWriteRule(forum.writeEnabled),
    accessBadge: getForumAccessBadge({
      forumType: forum.forumType,
      readAccess: forum.readAccess ?? defaultReadAccessForType(forum.forumType),
      requiredMembershipRole: forum.requiredMembershipRole,
    }),
    createdAt: forum.createdAt.toISOString(),
    updatedAt: forum.updatedAt.toISOString(),
  };
}

export async function listReadableForumsForUser(
  userId: string | null,
): Promise<CommunityForumEntry[]> {
  const { getVisibleForumsForUser } = await import("./forum-community-service");

  return getVisibleForumsForUser(userId);
}

export async function provisionCourseForums(
  courseId: string,
): Promise<void> {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { id: true, title: true, slug: true, forumsEnabled: true },
  });

  if (!course?.forumsEnabled) {
    return;
  }

  for (const template of COURSE_FORUM_TEMPLATES) {
    const title = `${course.title} – ${template.titleSuffix}`;
    const slug = buildCourseForumSlug(course.slug, template.purpose);

    const existing = await prisma.forum.findFirst({
      where: {
        courseId: course.id,
        forumPurpose: template.purpose,
      },
    });

    if (existing) {
      await prisma.forum.update({
        where: { id: existing.id },
        data: {
          title,
          slug,
          forumType: "course",
          readAccess: "course_access",
          isActive: true,
          sortOrder: template.sortOrder,
        },
      });
      continue;
    }

    await prisma.forum.create({
      data: {
        title,
        slug,
        description: `Forum für Kursteilnehmer: ${template.titleSuffix}`,
        forumType: "course",
        forumPurpose: template.purpose,
        readAccess: "course_access",
        courseId: course.id,
        sortOrder: template.sortOrder,
      },
    });
  }
}

export async function provisionMiniCourseGlobalForums(): Promise<void> {
  const enabled = await isMiniCourseGlobalForumsEnabled();

  if (!enabled) {
    return;
  }

  for (const template of MINI_COURSE_GLOBAL_FORUMS) {
    const existing = await prisma.forum.findUnique({
      where: { slug: template.slug },
    });

    if (existing) {
      await prisma.forum.update({
        where: { id: existing.id },
        data: {
          title: template.title,
          forumType: "mini_course_global",
          forumPurpose: template.purpose,
          readAccess: "mini_course_access",
          isActive: true,
          sortOrder: template.sortOrder,
        },
      });
      continue;
    }

    await prisma.forum.create({
      data: {
        title: template.title,
        slug: template.slug,
        description: `Gemeinsames Minikurs-Forum: ${template.title}`,
        forumType: "mini_course_global",
        forumPurpose: template.purpose,
        readAccess: "mini_course_access",
        sortOrder: template.sortOrder,
      },
    });
  }
}

export async function ensureCourseForumInfrastructure(
  courseId: string,
): Promise<void> {
  await provisionCourseForums(courseId);
  await provisionMiniCourseGlobalForums();
}

export async function getCourseForumsForUser(
  courseId: string,
  userId: string | null,
): Promise<CourseForumGroup> {
  const [courseForums, globalForums, globalEnabled, context] = await Promise.all([
    prisma.forum.findMany({
      where: { courseId, forumType: "course", isActive: true },
      include: { course: { select: { title: true } } },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.forum.findMany({
      where: { forumType: "mini_course_global", isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
    isMiniCourseGlobalForumsEnabled(),
    loadForumPermissionContext(userId),
  ]);

  const accessibleCourseForums: ForumEntry[] = [];

  for (const forum of courseForums) {
    if (await canReadForum(userId, forum, context)) {
      accessibleCourseForums.push(
        await toForumEntry(forum, { includeCounts: false }),
      );
    }
  }

  const accessibleGlobalForums: ForumEntry[] = [];

  if (globalEnabled) {
    for (const forum of globalForums) {
      if (await canReadForum(userId, forum, context)) {
        accessibleGlobalForums.push(
          await toForumEntry(forum, { includeCounts: false }),
        );
      }
    }
  }

  return {
    courseForums: accessibleCourseForums,
    globalMiniCourseForums: accessibleGlobalForums,
    globalMiniCourseForumsEnabled: globalEnabled,
  };
}

export async function getForumBySlug(
  slug: string,
): Promise<(Forum & { course: { title: string; slug: string } | null }) | null> {
  return prisma.forum.findUnique({
    where: { slug },
    include: {
      course: { select: { title: true, slug: true } },
    },
  });
}

export async function getForumById(
  forumId: string,
): Promise<Forum | null> {
  return prisma.forum.findUnique({ where: { id: forumId } });
}

export async function classifyExistingForums(): Promise<number> {
  const forums = await prisma.forum.findMany({
    where: {
      OR: [
        { slug: { in: [...KNOWN_MINI_COURSE_FORUM_SLUGS] } },
        { title: { startsWith: "Minikurse –" } },
      ],
    },
  });

  let updated = 0;

  for (const forum of forums) {
    if (
      forum.forumType === "mini_course_global" &&
      forum.readAccess === "mini_course_access"
    ) {
      continue;
    }

    await prisma.forum.update({
      where: { id: forum.id },
      data: {
        forumType: "mini_course_global",
        readAccess: "mini_course_access",
        requiredMembershipRole: null,
      },
    });

    updated += 1;
  }

  return updated;
}

export async function listAdminForums(): Promise<AdminForumEntry[]> {
  await classifyExistingForums();

  const forums = await prisma.forum.findMany({
    include: { course: { select: { title: true } } },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  const entries: AdminForumEntry[] = [];

  for (const forum of forums) {
    const base = await toForumEntry(forum);
    const permissionKind = permissionKindFromForum(forum);

    entries.push({
      ...base,
      permissionKind,
      visibilityHint: buildAdminVisibilityHint(forum),
    });
  }

  return entries;
}

function buildAdminVisibilityHint(forum: Forum): string {
  if (!forum.isActive) {
    return "Inaktiv — nur Admin/Support/Dozent sehen das Forum.";
  }

  const kindLabel =
    FORUM_PERMISSION_KIND_LABELS[permissionKindFromForum(forum)];

  return `${kindLabel} · ${describeForumWriteRule(forum.writeEnabled)}`;
}

export async function getAdminForumById(
  forumId: string,
): Promise<AdminForumEntry | null> {
  const forum = await prisma.forum.findUnique({
    where: { id: forumId },
    include: { course: { select: { title: true } } },
  });

  if (!forum) {
    return null;
  }

  const base = await toForumEntry(forum);

  return {
    ...base,
    permissionKind: permissionKindFromForum(forum),
    visibilityHint: buildAdminVisibilityHint(forum),
  };
}

export async function createForum(
  input: CreateForumInput,
): Promise<UserServiceResult<ForumEntry>> {
  const normalizedResult = normalizeCreateForumInput(input);

  if (!normalizedResult.success) {
    return normalizedResult;
  }

  const normalized = normalizedResult.data;

  const courseError = await validateForumCourseAssignment(
    normalized.forumType,
    normalized.courseId,
  );

  if (courseError) {
    return courseError;
  }

  const parentError = await validateParentForumAssignment(
    normalized.parentForumId,
  );

  if (parentError) {
    return parentError;
  }

  try {
    const slug =
      normalized.slug ||
      slugifyCourseTitle(normalized.title) ||
      `forum-${Date.now()}`;

    const forum = await prisma.forum.create({
      data: {
        title: normalized.title,
        slug,
        description: normalized.description,
        forumType: normalized.forumType,
        forumPurpose: normalized.forumPurpose ?? "custom",
        readAccess: normalized.readAccess,
        writeEnabled: normalized.writeEnabled,
        requiredMembershipRole: normalized.requiredMembershipRole,
        courseId: normalized.courseId,
        parentForumId: normalized.parentForumId,
        isActive: normalized.isActive,
        sortOrder: normalized.sortOrder,
      },
      include: { course: { select: { title: true } } },
    });

    return userSuccess(await toForumEntry(forum));
  } catch {
    return userFailure({
      code: "INTERNAL_ERROR",
      message: "Forum konnte nicht erstellt werden.",
    });
  }
}

export async function updateForum(
  forumId: string,
  input: UpdateForumInput,
): Promise<UserServiceResult<ForumEntry>> {
  const normalizedResult = await normalizeUpdateForumInput(forumId, input);

  if (!normalizedResult.success) {
    return normalizedResult;
  }

  const normalized = normalizedResult.data;

  if (normalized.parentForumId !== undefined) {
    const parentError = await validateParentForumAssignment(
      normalized.parentForumId ?? null,
      forumId,
    );

    if (parentError) {
      return parentError;
    }
  }

  try {
    const forum = await prisma.forum.update({
      where: { id: forumId },
      data: {
        title: normalized.title,
        slug: normalized.slug,
        description: normalized.description,
        forumType: normalized.forumType,
        forumPurpose: normalized.forumPurpose,
        readAccess: normalized.readAccess,
        writeEnabled: normalized.writeEnabled,
        requiredMembershipRole: normalized.requiredMembershipRole,
        courseId: normalized.courseId,
        parentForumId: normalized.parentForumId,
        isActive: normalized.isActive,
        sortOrder: normalized.sortOrder,
      },
      include: { course: { select: { title: true } } },
    });

    return userSuccess(await toForumEntry(forum));
  } catch {
    return userFailure({
      code: "INTERNAL_ERROR",
      message: "Forum konnte nicht aktualisiert werden.",
    });
  }
}

/**
 * Forum in der Admin-/Community-Reihenfolge nach oben oder unten verschieben.
 */
export async function reorderForum(
  forumId: string,
  direction: "up" | "down",
): Promise<UserServiceResult<true>> {
  const forums = await prisma.forum.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: { id: true, sortOrder: true },
  });

  const index = forums.findIndex((forum) => forum.id === forumId);

  if (index === -1) {
    return userFailure({
      code: "NOT_FOUND",
      message: "Forum nicht gefunden.",
    });
  }

  const targetIndex = direction === "up" ? index - 1 : index + 1;

  if (targetIndex < 0 || targetIndex >= forums.length) {
    return userSuccess(true);
  }

  const current = forums[index];
  const neighbor = forums[targetIndex];

  if (current.sortOrder === neighbor.sortOrder) {
    await prisma.forum.update({
      where: { id: current.id },
      data: {
        sortOrder:
          direction === "up" ? neighbor.sortOrder - 1 : neighbor.sortOrder + 1,
      },
    });
  } else {
    await prisma.$transaction([
      prisma.forum.update({
        where: { id: current.id },
        data: { sortOrder: neighbor.sortOrder },
      }),
      prisma.forum.update({
        where: { id: neighbor.id },
        data: { sortOrder: current.sortOrder },
      }),
    ]);
  }

  return userSuccess(true);
}

export async function deleteForum(
  forumId: string,
): Promise<UserServiceResult<true>> {
  try {
    await prisma.forum.delete({ where: { id: forumId } });

    return userSuccess(true);
  } catch {
    return userFailure({
      code: "INTERNAL_ERROR",
      message: "Forum konnte nicht gelöscht werden.",
    });
  }
}

export async function getMiniCourseGlobalForumsSetting(): Promise<boolean> {
  return isMiniCourseGlobalForumsEnabled();
}

export async function updateMiniCourseGlobalForumsSetting(
  enabled: boolean,
): Promise<void> {
  await setMiniCourseGlobalForumsEnabled(enabled);

  if (enabled) {
    await provisionMiniCourseGlobalForums();
  }
}

export async function listForumsForAdminFilters(
  filters: Prisma.ForumWhereInput = {},
): Promise<ForumEntry[]> {
  const forums = await prisma.forum.findMany({
    where: filters,
    include: { course: { select: { title: true } } },
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
  });

  const entries: ForumEntry[] = [];

  for (const forum of forums) {
    entries.push(await toForumEntry(forum));
  }

  return entries;
}

export async function explainForumVisibilityForUser(
  forumId: string,
  userId: string,
): Promise<{
  canRead: boolean;
  canWrite: boolean;
  hasCourseAccess: boolean;
  hasMembershipAccess: boolean;
  readRuleLabel: string;
}> {
  const forum = await prisma.forum.findUnique({
    where: { id: forumId },
    include: { course: { select: { title: true } } },
  });

  if (!forum) {
    return {
      canRead: false,
      canWrite: false,
      hasCourseAccess: false,
      hasMembershipAccess: false,
      readRuleLabel: "—",
    };
  }

  const context = await loadForumPermissionContext(userId);
  const canRead = await canReadForum(userId, forum, context);
  const canWrite = await canWriteForum(userId, forum, context);

  let hasCourseAccess = false;

  if (forum.courseId) {
    hasCourseAccess = await hasActiveCourseAccess(userId, forum.courseId);
  }

  let hasMembershipAccess = false;

  if (forum.forumType === "membership" || forum.readAccess === "membership") {
    hasMembershipAccess =
      context.membershipStatus === "active" && !context.membershipAccessBlocked;
  }

  return {
    canRead,
    canWrite,
    hasCourseAccess,
    hasMembershipAccess,
    readRuleLabel: describeForumReadRule({
      forumType: forum.forumType,
      readAccess: forum.readAccess,
      requiredMembershipRole: forum.requiredMembershipRole,
      courseTitle: forum.course?.title ?? null,
    }),
  };
}
