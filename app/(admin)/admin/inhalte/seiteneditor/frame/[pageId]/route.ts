/**
 * @file app/admin/inhalte/seiteneditor/frame/[pageId]/route.ts
 * @purpose Setzt Preview-Cookie und leitet zur echten Seite weiter (nur Admin).
 */

import { NextResponse } from "next/server";

import { assertAdminAccessFromRequest } from "@/lib/admin/admin-auth";
import { canAccessContentAdmin } from "@/lib/page-editor/page-editor-auth";
import { getEditablePageById } from "@/lib/page-editor/page-registry";
import { validatePageEditorSession } from "@/lib/page-editor/page-editor-session";
import {
  PAGE_EDITOR_PREVIEW_QUERY,
} from "@/lib/page-editor/preview-token-constants";
import { applyPageEditorPreviewCookie } from "@/lib/page-editor/preview-cookie";
import { verifyPageEditorPreviewToken } from "@/lib/page-editor/preview-token-edge";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ pageId: string }> };

export async function GET(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const access = await assertAdminAccessFromRequest(request);

  if (!access.success || !canAccessContentAdmin(access.data.systemRole)) {
    return NextResponse.redirect(new URL("/anmelden", request.url));
  }

  const { pageId } = await context.params;
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(
      new URL("/admin/inhalte/seiteneditor", request.url),
    );
  }

  const payload = await verifyPageEditorPreviewToken(token);

  if (
    !payload ||
    payload.pageId !== pageId ||
    payload.userId !== access.data.userId
  ) {
    return new NextResponse("Ungültiger oder abgelaufener Preview-Token.", {
      status: 403,
    });
  }

  const sessionValid = await validatePageEditorSession({
    sessionId: payload.sessionId,
    userId: payload.userId,
    pageId: payload.pageId,
  });

  if (!sessionValid) {
    return new NextResponse("Die Editor-Sitzung ist abgelaufen. Bitte melde dich erneut an.", {
      status: 403,
    });
  }

  const page = getEditablePageById(pageId);

  if (!page) {
    return new NextResponse("Seite nicht gefunden.", { status: 404 });
  }

  const target = new URL(page.path, request.url);
  target.searchParams.set(PAGE_EDITOR_PREVIEW_QUERY, token);

  const response = NextResponse.redirect(target);

  applyPageEditorPreviewCookie(response, token, payload.expiresAt);

  return response;
}
