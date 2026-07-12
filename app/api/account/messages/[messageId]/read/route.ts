import { NextResponse } from "next/server";

import { markAccountMessageRead } from "@/lib/account/account-message-service";
import { getSessionUserIdFromRequest } from "@/lib/auth/session";

type RouteContext = { params: Promise<{ messageId: string }> };

export async function POST(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const userId = await getSessionUserIdFromRequest(request);

  if (!userId) {
    return NextResponse.json(
      { success: false, error: { message: "Unauthorized" } },
      { status: 401 },
    );
  }

  const { messageId } = await context.params;
  const marked = await markAccountMessageRead(userId, messageId);

  if (!marked) {
    return NextResponse.json(
      { success: false, error: { message: "Nachricht nicht gefunden." } },
      { status: 404 },
    );
  }

  return NextResponse.json({ success: true, data: true });
}
