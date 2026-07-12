import { NextResponse } from "next/server";

import {
  listEmailLogs,
  listEmailTemplates,
  sendAdminTestEmail,
  sendStaffManualEmail,
} from "@/lib/email/admin-email-service";
import { listSenderIdentities, listProviderConfigs } from "@/lib/email/email-sender-service";
import { emailGuardResponse } from "@/lib/email/email-api-utils";
import { processEmailQueueBatch } from "@/lib/email/email-queue-service";

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const resource = url.searchParams.get("resource");

  const denied = await emailGuardResponse(
    request,
    resource === "logs" ? "email.logs.view" : "email.view",
  );

  if (denied) {
    return denied;
  }

  if (resource === "logs") {
    const status = url.searchParams.get("status") ?? undefined;
    const data = await listEmailLogs({ status });
    return NextResponse.json({ success: true, data });
  }

  if (resource === "templates") {
    const data = await listEmailTemplates();
    return NextResponse.json({ success: true, data });
  }

  if (resource === "senders") {
    const data = await listSenderIdentities();
    return NextResponse.json({ success: true, data });
  }

  if (resource === "providers") {
    const data = await listProviderConfigs();
    return NextResponse.json({ success: true, data });
  }

  return NextResponse.json(
    { success: false, error: { message: "Unbekannte Ressource." } },
    { status: 400 },
  );
}

export async function POST(request: Request): Promise<Response> {
  const denied = await emailGuardResponse(request, "email.retry");

  if (denied) {
    return denied;
  }

  const result = await processEmailQueueBatch();
  return NextResponse.json({ success: true, data: result });
}
