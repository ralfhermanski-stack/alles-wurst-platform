import { NextResponse } from "next/server";

import { recordShareEvent } from "@/lib/sharing/share-service";

import type { ShareEventType } from "@/lib/sharing/share-types";

export async function POST(
  request: Request,
  context: { params: Promise<{ shareToken: string }> },
): Promise<Response> {
  const { shareToken } = await context.params;
  const body = (await request.json()) as { event?: ShareEventType };

  if (!body.event) {
    return NextResponse.json(
      { success: false, error: { message: "Event fehlt." } },
      { status: 400 },
    );
  }

  await recordShareEvent(shareToken, body.event);
  return NextResponse.json({ success: true });
}
