/**
 * @file page-editor-preview.ts
 * @purpose Server-Hilfen zur Erkennung des geschützten Editor-Vorschau-Modus.
 */

import { cookies, headers } from "next/headers";

import {
  PAGE_EDITOR_PREVIEW_COOKIE,
  PAGE_EDITOR_PREVIEW_HEADER,
} from "./preview-token-constants";
import { verifyPageEditorPreviewToken } from "./preview-token-edge";

export async function getPageEditorPreviewPageId(): Promise<string | null> {
  const headerStore = await headers();
  const fromHeader = headerStore.get(PAGE_EDITOR_PREVIEW_HEADER);

  if (fromHeader) {
    return fromHeader;
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(PAGE_EDITOR_PREVIEW_COOKIE)?.value;

  if (!token) {
    return null;
  }

  const payload = await verifyPageEditorPreviewToken(token);
  return payload?.pageId ?? null;
}

export async function isPageEditorPreviewActive(): Promise<boolean> {
  return (await getPageEditorPreviewPageId()) !== null;
}
