import { NextResponse } from "next/server";

import { getUserAccountMessagesOverview } from "@/lib/account/account-message-service";
import { getSessionUserIdFromRequest } from "@/lib/auth/session";

export async function GET(request: Request): Promise<Response> {
  const userId = await getSessionUserIdFromRequest(request);

  if (!userId) {
    return NextResponse.json(
      { success: false, error: { message: "Unauthorized" } },
      { status: 401 },
    );
  }

  const { messages, unreadCount } = await getUserAccountMessagesOverview(userId);

  return NextResponse.json({
    success: true,
    data: {
      unreadCount,
      messages: messages.map((message) => ({
        id: message.id,
        messageType: message.messageType,
        title: message.title,
        body: message.body,
        linkUrl: message.linkUrl,
        readAt: message.readAt?.toISOString() ?? null,
        createdAt: message.createdAt.toISOString(),
      })),
    },
  });
}
