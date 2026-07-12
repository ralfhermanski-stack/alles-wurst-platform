/**
 * @file app/api/admin/platform-text/[key]/route.ts
 */

import { adminGuardResponse } from "@/lib/admin/admin-api-utils";
import { assertAdminAccessFromRequest } from "@/lib/admin/admin-auth";
import { hasAdminPermission } from "@/lib/admin/admin-permissions";
import { jsonFromPlatformTextResult } from "@/lib/platform-text/platform-text-api-utils";
import {
  getPlatformTextRecord,
  updatePlatformText,
} from "@/lib/platform-text/platform-text-service";
import { parseJsonBody } from "@/lib/tools/recipe-api-utils";

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
  const decodedKey = decodeURIComponent(key);
  const result = await getPlatformTextRecord(decodedKey);

  return jsonFromPlatformTextResult(result);
}

export async function PATCH(
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
      error: { code: "FORBIDDEN", message: "Keine Berechtigung zum Bearbeiten von Texten." },
    });
  }

  const body = await parseJsonBody(request);

  if (!body || typeof body.value !== "string") {
    return jsonFromPlatformTextResult({
      success: false,
      error: { code: "VALIDATION_ERROR", message: "Feld value ist erforderlich." },
    });
  }

  const { key } = await context.params;

  const result = await updatePlatformText({
    key: decodeURIComponent(key),
    value: body.value,
    userId: access.data.userId,
    changeNote: typeof body.changeNote === "string" ? body.changeNote : null,
  });

  return jsonFromPlatformTextResult(result);
}
