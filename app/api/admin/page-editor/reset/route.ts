/**
 * @file app/api/admin/page-editor/reset/route.ts
 */

import { jsonFromPageEditorResult } from "@/lib/page-editor/page-editor-api-utils";
import { assertPageEditorApiAccess } from "@/lib/page-editor/page-editor-api-guard";
import { resetPageEditorText } from "@/lib/page-editor/page-editor-service";
import { parseJsonBody } from "@/lib/tools/recipe-api-utils";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  const access = await assertPageEditorApiAccess(request);

  if (!access.ok) {
    return access.response;
  }

  const body = await parseJsonBody(request);

  if (!body || typeof body.pageId !== "string" || typeof body.textKey !== "string") {
    return jsonFromPageEditorResult({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "pageId und textKey sind erforderlich.",
      },
    });
  }

  const result = await resetPageEditorText({
    pageId: body.pageId,
    textKey: body.textKey,
    userId: access.actor.userId,
  });

  return jsonFromPageEditorResult(result);
}
