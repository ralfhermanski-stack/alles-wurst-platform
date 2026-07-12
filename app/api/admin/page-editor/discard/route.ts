/**
 * @file app/api/admin/page-editor/discard/route.ts
 */

import { jsonFromPageEditorResult } from "@/lib/page-editor/page-editor-api-utils";
import { assertPageEditorApiAccess } from "@/lib/page-editor/page-editor-api-guard";
import { discardPageDrafts } from "@/lib/page-editor/page-editor-service";
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

  const result = await discardPageDrafts({
    pageId: body.pageId,
    userId: access.actor.userId,
  });

  return jsonFromPageEditorResult(result);
}
