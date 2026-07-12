/**
 * @file forum-community-service.ts
 * @purpose Community-Übersicht: sichtbare Foren und echte Aktivitäten.
 */

import type { Forum, ForumReadAccess, ForumType } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { hasAdminPermission } from "@/lib/admin/admin-permissions";
import { isAdminSystemRole } from "@/lib/users/system-role";

import {
  canReadForum,
  loadForumPermissionContext,
  type ForumPermissionContext,
} from "./forum-permissions";
import {
  describeForumReadRule,
  describeForumWriteRule,
} from "./forum-labels";
import type {
  CommunityActivityEntry,
  CommunityForumEntry,
  CommunityOverview,
  ForumEntry,
} from "./forum-types";

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

function isStaffContext(context: ForumPermissionContext): boolean {
  if (!context.systemRole) {
    return false;
  }

  return (
    isAdminSystemRole(context.systemRole) ||
    hasAdminPermission(context.systemRole, "forums.moderate")
  );
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

async function toCommunityForumEntry(
  forum: Forum & { course?: { title: string } | null },
  lastActivity: { at: Date; summary: string } | null,
): Promise<CommunityForumEntry> {
  const counts = await getForumCounts(forum.id);
  const readAccess =
    forum.readAccess ?? defaultReadAccessForType(forum.forumType);

  const base: ForumEntry = {
    id: forum.id,
    title: forum.title,
    slug: forum.slug,
    description: forum.description,
    forumType: forum.forumType,
    forumPurpose: forum.forumPurpose,
    readAccess,
    writeEnabled: forum.writeEnabled ?? true,
    requiredMembershipRole: forum.requiredMembershipRole ?? null,
    courseId: forum.courseId,
    courseTitle: forum.course?.title ?? null,
    isActive: forum.isActive,
    sortOrder: forum.sortOrder,
    threadCount: counts.threadCount,
    postCount: counts.postCount,
    readRuleLabel: describeForumReadRule({
      forumType: forum.forumType,
      readAccess,
      requiredMembershipRole: forum.requiredMembershipRole,
      courseTitle: forum.course?.title ?? null,
    }),
    writeRuleLabel: describeForumWriteRule(forum.writeEnabled ?? true),
    createdAt: forum.createdAt.toISOString(),
    updatedAt: forum.updatedAt.toISOString(),
  };

  return {
    ...base,
    lastActivityAt: lastActivity?.at.toISOString() ?? null,
    lastActivitySummary: lastActivity?.summary ?? null,
  };
}

async function loadVisibleForums(
  userId: string | null,
): Promise<Array<Forum & { course?: { title: string } | null }>> {
  const context = await loadForumPermissionContext(userId);
  const staff = isStaffContext(context);

  const forums = await prisma.forum.findMany({
    where: staff ? {} : { isActive: true },
    include: { course: { select: { title: true } } },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  const visible: Array<Forum & { course?: { title: string } | null }> = [];

  for (const forum of forums) {
    if (await canReadForum(userId, forum, context)) {
      visible.push(forum);
    }
  }

  return visible;
}

async function loadLastActivityByForum(
  forumIds: string[],
): Promise<Map<string, { at: Date; summary: string }>> {
  const result = new Map<string, { at: Date; summary: string }>();

  if (forumIds.length === 0) {
    return result;
  }

  const [latestThreads, latestPosts] = await Promise.all([
    prisma.forumThread.findMany({
      where: { forumId: { in: forumIds } },
      orderBy: { updatedAt: "desc" },
      select: {
        forumId: true,
        updatedAt: true,
        title: true,
        displayNameSnapshot: true,
      },
    }),
    prisma.forumPost.findMany({
      where: { thread: { forumId: { in: forumIds } } },
      orderBy: { createdAt: "desc" },
      select: {
        createdAt: true,
        displayNameSnapshot: true,
        thread: {
          select: {
            forumId: true,
            title: true,
          },
        },
      },
    }),
  ]);

  for (const thread of latestThreads) {
    const existing = result.get(thread.forumId);

    if (!existing || thread.updatedAt > existing.at) {
      result.set(thread.forumId, {
        at: thread.updatedAt,
        summary: `${thread.displayNameSnapshot ?? "Wurstfreund"}: ${thread.title}`,
      });
    }
  }

  for (const post of latestPosts) {
    const forumId = post.thread.forumId;
    const existing = result.get(forumId);

    if (!existing || post.createdAt > existing.at) {
      result.set(forumId, {
        at: post.createdAt,
        summary: `${post.displayNameSnapshot ?? "Wurstfreund"} antwortete in „${post.thread.title}"`,
      });
    }
  }

  return result;
}

async function loadCommunityActivity(
  forumIds: string[],
  limit = 20,
): Promise<CommunityActivityEntry[]> {
  if (forumIds.length === 0) {
    return [];
  }

  const [threads, posts] = await Promise.all([
    prisma.forumThread.findMany({
      where: { forumId: { in: forumIds } },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        forum: { select: { slug: true, title: true } },
      },
    }),
    prisma.forumPost.findMany({
      where: { thread: { forumId: { in: forumIds } } },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        thread: {
          select: {
            slug: true,
            title: true,
            forum: { select: { slug: true, title: true } },
          },
        },
      },
    }),
  ]);

  const entries: CommunityActivityEntry[] = [
    ...threads.map((thread) => ({
      id: `thread-${thread.id}`,
      type: "thread" as const,
      forumSlug: thread.forum.slug,
      forumTitle: thread.forum.title,
      threadSlug: thread.slug,
      threadTitle: thread.title,
      authorDisplayName: thread.displayNameSnapshot ?? "Wurstfreund",
      summary: `Neues Thema: ${thread.title}`,
      createdAt: thread.createdAt.toISOString(),
    })),
    ...posts.map((post) => ({
      id: `post-${post.id}`,
      type: "reply" as const,
      forumSlug: post.thread.forum.slug,
      forumTitle: post.thread.forum.title,
      threadSlug: post.thread.slug,
      threadTitle: post.thread.title,
      authorDisplayName: post.displayNameSnapshot ?? "Wurstfreund",
      summary: `Antwort in „${post.thread.title}"`,
      createdAt: post.createdAt.toISOString(),
    })),
  ];

  entries.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return entries.slice(0, limit);
}

/**
 * Alle Foren, die der Nutzer auf der Community-Seite sehen darf.
 */
export async function getVisibleForumsForUser(
  userId: string | null,
): Promise<CommunityForumEntry[]> {
  const overview = await getCommunityOverview(userId);

  return overview.forums;
}

/**
 * Community-Übersicht mit Foren und Aktivitätsfeed (serverseitig gefiltert).
 */
export async function getCommunityOverview(
  userId: string | null,
): Promise<CommunityOverview> {
  const visibleForums = await loadVisibleForums(userId);
  const forumIds = visibleForums.map((forum) => forum.id);
  const lastActivity = await loadLastActivityByForum(forumIds);

  const forums: CommunityForumEntry[] = [];

  for (const forum of visibleForums) {
    forums.push(
      await toCommunityForumEntry(
        forum,
        lastActivity.get(forum.id) ?? null,
      ),
    );
  }

  const activity = await loadCommunityActivity(forumIds);

  return { forums, activity };
}
