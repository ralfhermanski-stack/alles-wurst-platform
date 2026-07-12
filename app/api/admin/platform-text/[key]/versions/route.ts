/**
 * @file app/api/admin/platform-text/[key]/versions/route.ts
 */

import { adminGuardResponse } from "@/lib/admin/admin-api-utils";
import { jsonFromPlatformTextResult } from "@/lib/platform-text/platform-text-api-utils";
import { listPlatformTextVersions } from "@/lib/platform-text/platform-text-service";

type RouteContext = { params: Promise<{ key: string }> };

export async function GET(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const denied = await adminGuardResponse(request);

  if (denied) {
    return denied;
  }

  const { key } = await context.params;
  const result = await listPlatformTextVersions(decodeURIComponent(key));

  return jsonFromPlatformTextResult(result);
}
