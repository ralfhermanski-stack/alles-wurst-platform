/**
 * @file app/api/admin/platform-text/[key]/reset/route.ts
 */

import { adminGuardResponse } from "@/lib/admin/admin-api-utils";
import { assertAdminAccessFromRequest } from "@/lib/admin/admin-auth";
import { hasAdminPermission } from "@/lib/admin/admin-permissions";
import { jsonFromPlatformTextResult } from "@/lib/platform-text/platform-text-api-utils";
import { resetPlatformText } from "@/lib/platform-text/platform-text-service";

type RouteContext = { params: Promise<{ key: string }> };

export async function POST(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const denied = await adminGuardResponse(request);

  if (denied) {
    return denied;
  }

  const access = await assertAdminAccessFromRequest(request);

  if (!access.success || !hasAdminPermission(access.data.systemRole, "settings.write")) {
    return jsonFromPlatformTextResult({
      success: false,
      error: { code: "FORBIDDEN", message: "Keine Berechtigung." },
    });
  }

  const { key } = await context.params;

  const result = await resetPlatformText({
    key: decodeURIComponent(key),
    userId: access.data.userId,
  });

  return jsonFromPlatformTextResult(result);
}
