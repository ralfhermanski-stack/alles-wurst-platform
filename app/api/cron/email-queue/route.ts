import { NextResponse } from "next/server";

import { authorizeEmailCron } from "@/lib/email/email-cron-auth";
import { processEmailQueueBatch } from "@/lib/email/email-queue-service";

export async function POST(request: Request): Promise<Response> {
  const auth = authorizeEmailCron(request);

  if (!auth.authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });
  }

  const result = await processEmailQueueBatch();

  return NextResponse.json({ success: true, data: result });
}
