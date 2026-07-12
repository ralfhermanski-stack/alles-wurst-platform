/**
 * @file app/api/admin/page-editor/pages/route.ts
 */

import { jsonFromPageEditorResult } from "@/lib/page-editor/page-editor-api-utils";
import { assertPageEditorApiAccess } from "@/lib/page-editor/page-editor-api-guard";
import { listEditablePages } from "@/lib/page-editor/page-editor-service";

export const runtime = "nodejs";

export async function GET(request: Request): Promise<Response> {
  const access = await assertPageEditorApiAccess(request);

  if (!access.ok) {
    return access.response;
  }

  const url = new URL(request.url);
  const category = url.searchParams.get("category") ?? undefined;
  const search = url.searchParams.get("search") ?? undefined;

  const result = await listEditablePages({ category, search });
  return jsonFromPageEditorResult(result);
}
