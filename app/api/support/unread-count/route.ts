import { NextResponse } from "next/server";

import { getSessionUserIdFromRequest } from "@/lib/auth/session";
import { countUnreadSupportTickets } from "@/lib/support/support-ticket-service";

export async function GET(request: Request): Promise<Response> {
  const userId = await getSessionUserIdFromRequest(request);

  if (!userId) {
    return NextResponse.json(
      { success: false, error: { message: "Unauthorized" } },
      { status: 401 },
    );
  }

  const unreadCount = await countUnreadSupportTickets(userId);

  return NextResponse.json({ success: true, data: { unreadCount } });
}
