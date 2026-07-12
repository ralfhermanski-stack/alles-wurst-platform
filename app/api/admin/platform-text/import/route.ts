/**
 * @file app/api/admin/platform-text/import/route.ts
 */

import { adminGuardResponse } from "@/lib/admin/admin-api-utils";
import { assertAdminAccessFromRequest } from "@/lib/admin/admin-auth";
import { hasAdminPermission } from "@/lib/admin/admin-permissions";
import { jsonFromPlatformTextResult } from "@/lib/platform-text/platform-text-api-utils";
import { importPlatformTexts } from "@/lib/platform-text/platform-text-service";
import { parseJsonBody } from "@/lib/tools/recipe-api-utils";

export async function POST(request: Request): Promise<Response> {
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

  const body = await parseJsonBody(request);

  if (!body || !Array.isArray(body.texts)) {
    return jsonFromPlatformTextResult({
      success: false,
      error: { code: "VALIDATION_ERROR", message: "Array texts ist erforderlich." },
    });
  }

  const texts = body.texts
    .filter(
      (item): item is { key: string; value: string } =>
        typeof item === "object" &&
        item !== null &&
        typeof item.key === "string" &&
        typeof item.value === "string",
    )
    .map((item) => ({ key: item.key, value: item.value }));

  const result = await importPlatformTexts({
    texts,
    userId: access.data.userId,
  });

  return jsonFromPlatformTextResult(result);
}
