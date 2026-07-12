/**
 * @file app/api/admin/page-editor/publish/route.ts
 */

import { invalidatePlatformTextCache } from "@/lib/platform-text/platform-text-cache";
import { jsonFromPageEditorResult } from "@/lib/page-editor/page-editor-api-utils";
import { assertPageEditorApiAccess } from "@/lib/page-editor/page-editor-api-guard";
import { publishPageDrafts } from "@/lib/page-editor/page-editor-service";
import { parseJsonBody } from "@/lib/tools/recipe-api-utils";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  const access = await assertPageEditorApiAccess(request);

  if (!access.ok) {
    return access.response;
  }

  const body = await parseJsonBody(request);

  if (!body || typeof body.pageId !== "string") {
    return jsonFromPageEditorResult({
      success: false,
      error: { code: "VALIDATION_ERROR", message: "pageId ist erforderlich." },
    });
  }

  const result = await publishPageDrafts({
    pageId: body.pageId,
    userId: access.actor.userId,
  });

  if (result.success) {
    invalidatePlatformTextCache();
  }

  return jsonFromPageEditorResult(result);
}
