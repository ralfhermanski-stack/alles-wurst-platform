import { NextResponse } from "next/server";

import { getAdminEmailDashboard } from "@/lib/email/admin-email-service";
import { emailGuardResponse } from "@/lib/email/email-api-utils";

export async function GET(request: Request): Promise<Response> {
  const denied = await emailGuardResponse(request, "email.view");

  if (denied) {
    return denied;
  }

  const data = await getAdminEmailDashboard();
  return NextResponse.json({ success: true, data });
}
