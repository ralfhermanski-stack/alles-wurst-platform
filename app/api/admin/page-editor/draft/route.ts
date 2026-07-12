/**
 * @file app/api/admin/page-editor/draft/route.ts
 */

import { jsonFromPageEditorResult } from "@/lib/page-editor/page-editor-api-utils";
import { assertPageEditorApiAccess } from "@/lib/page-editor/page-editor-api-guard";
import { savePageEditorDraft } from "@/lib/page-editor/page-editor-service";
import { parseJsonBody } from "@/lib/tools/recipe-api-utils";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  const access = await assertPageEditorApiAccess(request);

  if (!access.ok) {
    return access.response;
  }

  const body = await parseJsonBody(request);

  if (
    !body ||
    typeof body.pageId !== "string" ||
    typeof body.textKey !== "string" ||
    typeof body.value !== "string"
  ) {
    return jsonFromPageEditorResult({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "pageId, textKey und value sind erforderlich.",
      },
    });
  }

  const result = await savePageEditorDraft({
    pageId: body.pageId,
    textKey: body.textKey,
    value: body.value,
    userId: access.actor.userId,
    pagePath: typeof body.pagePath === "string" ? body.pagePath : null,
  });

  return jsonFromPageEditorResult(result);
}
