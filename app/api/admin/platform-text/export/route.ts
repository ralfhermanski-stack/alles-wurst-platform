/**
 * @file app/api/admin/platform-text/export/route.ts
 */

import { adminGuardResponse } from "@/lib/admin/admin-api-utils";
import { jsonFromPlatformTextResult } from "@/lib/platform-text/platform-text-api-utils";
import { exportPlatformTexts } from "@/lib/platform-text/platform-text-service";

export async function GET(request: Request): Promise<Response> {
  const denied = await adminGuardResponse(request);

  if (denied) {
    return denied;
  }

  const locale = new URL(request.url).searchParams.get("locale") ?? undefined;
  const result = await exportPlatformTexts(locale);

  return jsonFromPlatformTextResult(result);
}
