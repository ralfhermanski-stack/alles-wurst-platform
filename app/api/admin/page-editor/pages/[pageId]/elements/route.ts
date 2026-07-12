/**
 * @file app/api/admin/page-editor/pages/[pageId]/elements/route.ts
 */

import { jsonFromPageEditorResult } from "@/lib/page-editor/page-editor-api-utils";
import { assertPageEditorApiAccess } from "@/lib/page-editor/page-editor-api-guard";
import { getPageEditorElements } from "@/lib/page-editor/page-editor-service";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ pageId: string }> };

export async function GET(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const access = await assertPageEditorApiAccess(request);

  if (!access.ok) {
    return access.response;
  }

  const { pageId } = await context.params;
  const result = await getPageEditorElements(pageId);
  return jsonFromPageEditorResult(result);
}
