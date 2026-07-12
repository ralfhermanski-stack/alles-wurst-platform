import { NextResponse } from "next/server";

import { countUnreadAccountMessages } from "@/lib/account/account-message-service";
import { getSessionUserIdFromRequest } from "@/lib/auth/session";

export async function GET(request: Request): Promise<Response> {
  const userId = await getSessionUserIdFromRequest(request);

  if (!userId) {
    return NextResponse.json(
      { success: false, error: { message: "Unauthorized" } },
      { status: 401 },
    );
  }

  const unreadCount = await countUnreadAccountMessages(userId);

  return NextResponse.json({ success: true, data: { unreadCount } });
}
