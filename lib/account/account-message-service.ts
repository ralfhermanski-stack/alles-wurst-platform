/**
 * @file account-message-service.ts
 */

import { prisma } from "@/lib/db/prisma";

export async function createUserAccountMessage(input: {
  userId: string;
  messageType: string;
  title: string;
  body: string;
  linkUrl?: string | null;
}) {
  return prisma.userAccountMessage.create({
    data: {
      userId: input.userId,
      messageType: input.messageType,
      title: input.title,
      body: input.body,
      linkUrl: input.linkUrl ?? null,
    },
  });
}

export async function listUserAccountMessages(userId: string, limit = 20) {
  return prisma.userAccountMessage.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function countUnreadAccountMessages(userId: string): Promise<number> {
  return prisma.userAccountMessage.count({
    where: { userId, readAt: null },
  });
}

export async function getUserAccountMessagesOverview(userId: string, limit = 30) {
  const [messages, unreadCount] = await Promise.all([
    listUserAccountMessages(userId, limit),
    countUnreadAccountMessages(userId),
  ]);

  return { messages, unreadCount };
}

export async function markAccountMessageRead(
  userId: string,
  messageId: string,
): Promise<boolean> {
  const result = await prisma.userAccountMessage.updateMany({
    where: { id: messageId, userId },
    data: { readAt: new Date() },
  });

  return result.count > 0;
}
