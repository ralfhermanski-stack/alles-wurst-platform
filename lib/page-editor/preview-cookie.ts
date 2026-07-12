/**
 * @file preview-cookie.ts
 * @purpose Setzt den httpOnly Preview-Cookie für den Seiteneditor.
 */

import type { NextResponse } from "next/server";

import { PAGE_EDITOR_PREVIEW_COOKIE } from "./preview-token-constants";

export function applyPageEditorPreviewCookie(
  response: NextResponse,
  token: string,
  expiresAtMs: number,
): void {
  response.cookies.set({
    name: PAGE_EDITOR_PREVIEW_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: Math.max(0, Math.floor((expiresAtMs - Date.now()) / 1000)),
  });
}
