/**
 * @file page-editor-client.ts
 */

import { adminFetch } from "@/lib/admin/admin-fetch";

import type {
  EditablePageListItem,
  PageEditorElementPayload,
} from "./page-editor-types";

export async function fetchEditablePages(filters?: {
  category?: string;
  search?: string;
}) {
  const params = new URLSearchParams();

  if (filters?.category) {
    params.set("category", filters.category);
  }

  if (filters?.search?.trim()) {
    params.set("search", filters.search.trim());
  }

  const query = params.toString();
  const url = query
    ? `/api/admin/page-editor/pages?${query}`
    : "/api/admin/page-editor/pages";

  return adminFetch<EditablePageListItem[]>(url);
}

export async function fetchPageEditorElements(pageId: string) {
  return adminFetch<PageEditorElementPayload[]>(
    `/api/admin/page-editor/pages/${encodeURIComponent(pageId)}/elements`,
  );
}

export async function createPageEditorSessionApi(pageId: string) {
  return adminFetch<{
    sessionId: string;
    previewToken: string;
    previewPath: string;
    frameUrl: string;
    expiresAt: string;
  }>("/api/admin/page-editor/session", {
    method: "POST",
    body: JSON.stringify({ pageId }),
  });
}

export async function enterPageEditorPreviewApi(pageId: string, token: string) {
  return adminFetch<true>("/api/admin/page-editor/preview/enter", {
    method: "POST",
    body: JSON.stringify({ pageId, token }),
  });
}

export async function savePageEditorDraftApi(input: {
  pageId: string;
  textKey: string;
  value: string;
}) {
  return adminFetch<{ textKey: string; draftValue: string }>(
    "/api/admin/page-editor/draft",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}

export async function publishPageEditorDraftsApi(pageId: string) {
  return adminFetch<{ published: number }>("/api/admin/page-editor/publish", {
    method: "POST",
    body: JSON.stringify({ pageId }),
  });
}

export async function discardPageEditorDraftsApi(pageId: string) {
  return adminFetch<{ discarded: number }>("/api/admin/page-editor/discard", {
    method: "POST",
    body: JSON.stringify({ pageId }),
  });
}

export async function uploadPageEditorImageApi(input: {
  pageId: string;
  textKey: string;
  file: File;
}) {
  const formData = new FormData();
  formData.set("pageId", input.pageId);
  formData.set("textKey", input.textKey);
  formData.set("file", input.file);

  return adminFetch<{ url: string; textKey: string; draftValue: string }>(
    "/api/admin/page-editor/image",
    {
      method: "POST",
      body: formData,
    },
  );
}
