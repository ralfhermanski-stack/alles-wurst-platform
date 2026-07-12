/**
 * @file forum-thread-service.ts
 * @purpose Threads und Beiträge mit Rechteprüfung und Autoren-Snapshots.
 */

import type { Forum, ForumThread } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { findUserById } from "@/lib/users/user-service";
import {
  userFailure,
  userSuccess,
  type UserServiceResult,
} from "@/lib/users/user-errors";
import { getPublicUserName } from "@/lib/users/public-user";
import { buildPublicAvatarUrl } from "@/lib/users/user-avatar-storage";
import { slugifyCourseTitle } from "@/lib/courses/course-types";

import { getPublicAuthorBadge } from "./forum-labels";
import {
  canModerateForum,
  canReadForum,
  canWriteForum,
  forumNotFoundError,
  loadForumPermissionContext,
  threadNotFoundError,
} from "./forum-permissions";
import { getForumBySlug } from "./forum-service";
import type {
  CreateForumPostInput,
  CreateForumThreadInput,
  ForumAuthorEntry,
  ForumPostEntry,
  ForumThreadDetail,
  ForumThreadEntry,
} from "./forum-types";

async function buildAuthorSnapshot(
  userId: string,
): Promise<{
  displayName: string;
  avatarUrl: string | null;
  roleBadge: string | null;
}> {
  const userResult = await findUserById(userId);

  if (!userResult.success || !userResult.data) {
    return {
      displayName: "Wurstfreund",
      avatarUrl: null,
      roleBadge: null,
    };
  }

  const user = userResult.data;

  return {
    displayName: getPublicUserName({ profile: user.profile }),
    avatarUrl: user.profile?.avatarUrl?.trim()
      ? buildPublicAvatarUrl(user.id)
      : null,
    roleBadge: getPublicAuthorBadge(user.systemRole),
  };
}

function toAuthorEntry(input: {
  displayNameSnapshot: string | null;
  avatarUrlSnapshot: string | null;
  authorRoleBadge: string | null;
}): ForumAuthorEntry {
  return {
    displayName: input.displayNameSnapshot ?? "Wurstfreund",
    avatarUrl: input.avatarUrlSnapshot,
    roleBadge: input.authorRoleBadge,
  };
}

async function ensureUniqueThreadSlug(
  forumId: string,
  baseSlug: string,
): Promise<string> {
  let slug = baseSlug || `thema-${Date.now()}`;
  let suffix = 0;

  while (true) {
    const existing = await prisma.forumThread.findUnique({
      where: {
        forumId_slug: { forumId, slug },
      },
      select: { id: true },
    });

    if (!existing) {
      return slug;
    }

    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }
}

async function getReadableForumBySlug(
  slug: string,
  userId: string | null,
): Promise<UserServiceResult<Forum & { course: { title: string; slug: string } | null }>> {
  const forum = await getForumBySlug(slug);

  if (!forum) {
    return userFailure(forumNotFoundError());
  }

  const context = await loadForumPermissionContext(userId);

  if (!(await canReadForum(userId, forum, context))) {
    return userFailure(forumNotFoundError());
  }

  return userSuccess(forum);
}

export async function listForumThreads(
  forumSlug: string,
  userId: string | null,
): Promise<UserServiceResult<ForumThreadEntry[]>> {
  const forumResult = await getReadableForumBySlug(forumSlug, userId);

  if (!forumResult.success) {
    return forumResult;
  }

  const forum = forumResult.data;

  const threads = await prisma.forumThread.findMany({
    where: { forumId: forum.id },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { posts: true } },
    },
  });

  return userSuccess(
    threads.map((thread) => ({
      id: thread.id,
      title: thread.title,
      slug: thread.slug,
      body: thread.body,
      isLocked: thread.isLocked,
      author: toAuthorEntry(thread),
      replyCount: thread._count.posts,
      createdAt: thread.createdAt.toISOString(),
      updatedAt: thread.updatedAt.toISOString(),
    })),
  );
}

export async function getForumThreadDetail(
  forumSlug: string,
  threadSlug: string,
  userId: string | null,
): Promise<UserServiceResult<ForumThreadDetail>> {
  const forumResult = await getReadableForumBySlug(forumSlug, userId);

  if (!forumResult.success) {
    return forumResult;
  }

  const forum = forumResult.data;
  const context = await loadForumPermissionContext(userId);

  const thread = await prisma.forumThread.findUnique({
    where: {
      forumId_slug: {
        forumId: forum.id,
        slug: threadSlug,
      },
    },
    include: {
      posts: { orderBy: { createdAt: "asc" } },
      _count: { select: { posts: true } },
    },
  });

  if (!thread) {
    return userFailure(threadNotFoundError());
  }

  const canWrite = await canWriteForum(userId, forum, context);
  const canModerate = userId
    ? await canModerateForum(userId, forum, context)
    : false;

  const posts: ForumPostEntry[] = thread.posts.map((post) => ({
    id: post.id,
    body: post.body,
    author: toAuthorEntry(post),
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
  }));

  return userSuccess({
    id: thread.id,
    title: thread.title,
    slug: thread.slug,
    body: thread.body,
    isLocked: thread.isLocked,
    author: toAuthorEntry(thread),
    replyCount: thread._count.posts,
    createdAt: thread.createdAt.toISOString(),
    updatedAt: thread.updatedAt.toISOString(),
    posts,
    canWrite: canWrite && !thread.isLocked,
    canModerate,
  });
}

export async function createForumThread(
  forumSlug: string,
  userId: string,
  input: CreateForumThreadInput,
): Promise<UserServiceResult<ForumThreadEntry>> {
  const forumResult = await getReadableForumBySlug(forumSlug, userId);

  if (!forumResult.success) {
    return forumResult;
  }

  const forum = forumResult.data;
  const context = await loadForumPermissionContext(userId);

  if (!(await canWriteForum(userId, forum, context))) {
    return userFailure(forumNotFoundError());
  }

  const title = input.title.trim();
  const body = input.body.trim();

  if (!title || !body) {
    return userFailure({
      code: "VALIDATION_ERROR",
      message: "Titel und Beitrag sind erforderlich.",
    });
  }

  const author = await buildAuthorSnapshot(userId);
  const baseSlug = slugifyCourseTitle(title) || `thema-${Date.now()}`;
  const slug = await ensureUniqueThreadSlug(forum.id, baseSlug);

  const thread = await prisma.forumThread.create({
    data: {
      forumId: forum.id,
      authorUserId: userId,
      title,
      slug,
      body,
      displayNameSnapshot: author.displayName,
      avatarUrlSnapshot: author.avatarUrl,
      authorRoleBadge: author.roleBadge,
    },
    include: {
      _count: { select: { posts: true } },
    },
  });

  return userSuccess({
    id: thread.id,
    title: thread.title,
    slug: thread.slug,
    body: thread.body,
    isLocked: thread.isLocked,
    author: toAuthorEntry(thread),
    replyCount: thread._count.posts,
    createdAt: thread.createdAt.toISOString(),
    updatedAt: thread.updatedAt.toISOString(),
  });
}

export async function createForumPost(
  forumSlug: string,
  threadSlug: string,
  userId: string,
  input: CreateForumPostInput,
): Promise<UserServiceResult<ForumPostEntry>> {
  const forumResult = await getReadableForumBySlug(forumSlug, userId);

  if (!forumResult.success) {
    return forumResult;
  }

  const forum = forumResult.data;
  const context = await loadForumPermissionContext(userId);

  if (!(await canWriteForum(userId, forum, context))) {
    return userFailure(forumNotFoundError());
  }

  const thread = await prisma.forumThread.findUnique({
    where: {
      forumId_slug: {
        forumId: forum.id,
        slug: threadSlug,
      },
    },
  });

  if (!thread) {
    return userFailure(threadNotFoundError());
  }

  if (thread.isLocked) {
    return userFailure({
      code: "FORBIDDEN",
      message: "Dieses Thema ist gesperrt.",
    });
  }

  const body = input.body.trim();

  if (!body) {
    return userFailure({
      code: "VALIDATION_ERROR",
      message: "Beitrag darf nicht leer sein.",
    });
  }

  const author = await buildAuthorSnapshot(userId);

  const post = await prisma.forumPost.create({
    data: {
      threadId: thread.id,
      authorUserId: userId,
      body,
      displayNameSnapshot: author.displayName,
      avatarUrlSnapshot: author.avatarUrl,
      authorRoleBadge: author.roleBadge,
    },
  });

  await prisma.forumThread.update({
    where: { id: thread.id },
    data: { updatedAt: new Date() },
  });

  return userSuccess({
    id: post.id,
    body: post.body,
    author: toAuthorEntry(post),
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
  });
}

export async function getReadableThreadOrFail(
  forum: Forum,
  threadSlug: string,
  userId: string | null,
): Promise<UserServiceResult<ForumThread>> {
  const context = await loadForumPermissionContext(userId);

  if (!(await canReadForum(userId, forum, context))) {
    return userFailure(forumNotFoundError());
  }

  const thread = await prisma.forumThread.findUnique({
    where: {
      forumId_slug: {
        forumId: forum.id,
        slug: threadSlug,
      },
    },
  });

  if (!thread) {
    return userFailure(threadNotFoundError());
  }

  return userSuccess(thread);
}
