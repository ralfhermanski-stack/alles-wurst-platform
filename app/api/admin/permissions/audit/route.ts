import { NextResponse } from "next/server";

import { jsonFromAuthResult } from "@/lib/auth/auth-api-utils";
import { listPermissionAuditLogs } from "@/lib/permissions/permission-audit";
import { assertPermissionAccessFromRequest } from "@/lib/permissions/permission-auth";

export async function GET(request: Request): Promise<Response> {
  const access = await assertPermissionAccessFromRequest(request);

  if (!access.success) {
    return jsonFromAuthResult(access);
  }

  const logs = await listPermissionAuditLogs({ limit: 200 });
  return NextResponse.json({ success: true, data: logs });
}
