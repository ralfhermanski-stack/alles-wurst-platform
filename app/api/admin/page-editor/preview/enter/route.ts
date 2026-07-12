/**
 * @file app/api/admin/page-editor/preview/enter/route.ts
 */

import { NextResponse } from "next/server";

import { jsonFromPageEditorResult } from "@/lib/page-editor/page-editor-api-utils";
import { assertPageEditorApiAccess } from "@/lib/page-editor/page-editor-api-guard";
import { validatePageEditorSession } from "@/lib/page-editor/page-editor-session";
import { applyPageEditorPreviewCookie } from "@/lib/page-editor/preview-cookie";
import { verifyPageEditorPreviewToken } from "@/lib/page-editor/preview-token-edge";
import { parseJsonBody } from "@/lib/tools/recipe-api-utils";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  const access = await assertPageEditorApiAccess(request);

  if (!access.ok) {
    return access.response;
  }

  const body = await parseJsonBody(request);

  if (!body || typeof body.pageId !== "string" || typeof body.token !== "string") {
    return jsonFromPageEditorResult({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "pageId und token sind erforderlich.",
      },
    });
  }

  const payload = await verifyPageEditorPreviewToken(body.token);

  if (
    !payload ||
    payload.pageId !== body.pageId ||
    payload.userId !== access.actor.userId
  ) {
    return jsonFromPageEditorResult({
      success: false,
      error: {
        code: "FORBIDDEN",
        message: "Ungültiger oder abgelaufener Preview-Token.",
      },
    });
  }

  const sessionValid = await validatePageEditorSession({
    sessionId: payload.sessionId,
    userId: payload.userId,
    pageId: payload.pageId,
  });

  if (!sessionValid) {
    return jsonFromPageEditorResult({
      success: false,
      error: {
        code: "FORBIDDEN",
        message: "Die Editor-Sitzung ist abgelaufen. Bitte melde dich erneut an.",
      },
    });
  }

  const response = NextResponse.json({ success: true, data: true });

  applyPageEditorPreviewCookie(response, body.token, payload.expiresAt);

  return response;
}
