/**
 * @file forum-watch-service.ts
 * @purpose Ungelesen-Zähler und Benachrichtigungen für Forum-Threads.
 */

import { prisma } from "@/lib/db/prisma";
import { createUserAccountMessage } from "@/lib/account/account-message-service";

export async function ensureForumThreadWatch(
  threadId: string,
  userId: string,
  options: { resetUnread?: boolean } = {},
): Promise<void> {
  const now = new Date();

  await prisma.forumThreadWatch.upsert({
    where: {
      threadId_userId: { threadId, userId },
    },
    create: {
      threadId,
      userId,
      unreadCount: 0,
      lastReadAt: now,
    },
    update: options.resetUnread
      ? { unreadCount: 0, lastReadAt: now }
      : { updatedAt: now },
  });
}

export async function markForumThreadRead(
  threadId: string,
  userId: string,
): Promise<void> {
  await prisma.forumThreadWatch.updateMany({
    where: { threadId, userId },
    data: {
      unreadCount: 0,
      lastReadAt: new Date(),
    },
  });
}

export async function countUnreadForumThreads(userId: string): Promise<number> {
  return prisma.forumThreadWatch.count({
    where: { userId, unreadCount: { gt: 0 } },
  });
}

/**
 * Anzahl ungelesener Threads je Forum (für Hub-Badges).
 */
export async function countUnreadThreadsByForumIds(
  userId: string,
  forumIds: string[],
): Promise<Map<string, number>> {
  const result = new Map<string, number>();

  if (forumIds.length === 0) {
    return result;
  }

  const rows = await prisma.forumThreadWatch.groupBy({
    by: ["threadId"],
    where: {
      userId,
      unreadCount: { gt: 0 },
      thread: { forumId: { in: forumIds } },
    },
    _count: { _all: true },
  });

  if (rows.length === 0) {
    return result;
  }

  const threadIds = rows.map((row) => row.threadId);
  const threads = await prisma.forumThread.findMany({
    where: { id: { in: threadIds } },
    select: { id: true, forumId: true },
  });

  for (const thread of threads) {
    result.set(thread.forumId, (result.get(thread.forumId) ?? 0) + 1);
  }

  return result;
}

/**
 * Nach einer Antwort: Poster liest mit, alle anderen Watcher +1,
 * Thread-Autor wird benachrichtigt (Account-Nachricht).
 */
export async function notifyForumThreadReply(input: {
  threadId: string;
  forumSlug: string;
  threadSlug: string;
  threadTitle: string;
  threadAuthorUserId: string;
  replyAuthorUserId: string;
  replyAuthorDisplayName: string;
}): Promise<void> {
  // Antwortender beobachtet und ist gelesen
  await ensureForumThreadWatch(input.threadId, input.replyAuthorUserId, {
    resetUnread: true,
  });

  // OP immer im Watch (falls noch nicht)
  if (input.threadAuthorUserId !== input.replyAuthorUserId) {
    await ensureForumThreadWatch(input.threadId, input.threadAuthorUserId);
  }

  await prisma.forumThreadWatch.updateMany({
    where: {
      threadId: input.threadId,
      userId: { not: input.replyAuthorUserId },
    },
    data: {
      unreadCount: { increment: 1 },
    },
  });

  if (input.threadAuthorUserId === input.replyAuthorUserId) {
    return;
  }

  await createUserAccountMessage({
    userId: input.threadAuthorUserId,
    messageType: "forum_reply",
    title: `Neue Antwort: ${input.threadTitle}`,
    body: `${input.replyAuthorDisplayName} hat auf dein Forum-Thema geantwortet.`,
    linkUrl: `/mein-bereich/foren/${input.forumSlug}/${input.threadSlug}`,
  });
}
