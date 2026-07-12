/**
 * @file platform-text-client.ts
 */

import { adminFetch } from "@/lib/admin/admin-fetch";
import type {
  PlatformTextChangeLogRecord,
  PlatformTextRecord,
  PlatformTextVersionRecord,
} from "./platform-text-types";

type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } };

export async function fetchPlatformTexts(filters?: {
  category?: string;
  search?: string;
}): Promise<ApiResponse<PlatformTextRecord[]>> {
  const params = new URLSearchParams();

  if (filters?.category) {
    params.set("category", filters.category);
  }

  if (filters?.search) {
    params.set("search", filters.search);
  }

  const query = params.toString();
  const url = query
    ? `/api/admin/platform-text?${query}`
    : "/api/admin/platform-text";

  return adminFetch<PlatformTextRecord[]>(url);
}

export async function fetchPlatformText(
  key: string,
): Promise<ApiResponse<PlatformTextRecord>> {
  return adminFetch<PlatformTextRecord>(
    `/api/admin/platform-text/${encodeURIComponent(key)}`,
  );
}

export async function updatePlatformTextApi(
  key: string,
  value: string,
  changeNote?: string,
): Promise<ApiResponse<PlatformTextRecord>> {
  return adminFetch<PlatformTextRecord>(
    `/api/admin/platform-text/${encodeURIComponent(key)}`,
    {
      method: "PATCH",
      body: JSON.stringify({ value, changeNote }),
    },
  );
}

export async function resetPlatformTextApi(
  key: string,
): Promise<ApiResponse<PlatformTextRecord>> {
  return adminFetch<PlatformTextRecord>(
    `/api/admin/platform-text/${encodeURIComponent(key)}/reset`,
    { method: "POST" },
  );
}

export async function fetchPlatformTextVersions(
  key: string,
): Promise<ApiResponse<PlatformTextVersionRecord[]>> {
  return adminFetch<PlatformTextVersionRecord[]>(
    `/api/admin/platform-text/${encodeURIComponent(key)}/versions`,
  );
}

export async function fetchPlatformTextChangeLogs(
  key: string,
): Promise<ApiResponse<PlatformTextChangeLogRecord[]>> {
  return adminFetch<PlatformTextChangeLogRecord[]>(
    `/api/admin/platform-text/${encodeURIComponent(key)}/changelog`,
  );
}

export async function exportPlatformTextsApi(): Promise<ApiResponse<{
  exportedAt: string;
  locale: string;
  texts: PlatformTextRecord[];
}>> {
  return adminFetch("/api/admin/platform-text/export");
}

export async function importPlatformTextsApi(
  texts: Array<{ key: string; value: string }>,
): Promise<ApiResponse<{ updated: number; skipped: number }>> {
  return adminFetch("/api/admin/platform-text/import", {
    method: "POST",
    body: JSON.stringify({ texts }),
  });
}

export async function fetchHardcodedTextReport(): Promise<
  ApiResponse<{
    generatedAt: string;
    totalFindings: number;
    managedKeys: number;
    findings: Array<{
      file: string;
      line: number;
      text: string;
      managed: boolean;
      suggestedKey?: string;
    }>;
  }>
> {
  return adminFetch("/api/admin/platform-text/report");
}
