/**
 * @file page-seo-client.ts
 * @purpose Admin-Client für site-weites SEO.
 */

import { adminFetch, type AdminApiResponse } from "@/lib/admin/admin-fetch";

import type {
  PageSeoAdminListItem,
  PageSeoProcessSummary,
  PageSeoScanSummary,
  PageSeoSettingsData,
  UpdatePageSeoSettingsInput,
} from "./page-seo-types";

export type PageSeoAdminData = {
  settings: PageSeoSettingsData;
  pages: PageSeoAdminListItem[];
  queuePending: number;
};

export async function getPageSeoAdminApi(): Promise<AdminApiResponse<PageSeoAdminData>> {
  return adminFetch<PageSeoAdminData>("/api/admin/page-seo");
}

export async function updatePageSeoSettingsApi(
  input: UpdatePageSeoSettingsInput,
): Promise<AdminApiResponse<PageSeoSettingsData>> {
  return adminFetch<PageSeoSettingsData>("/api/admin/page-seo/settings", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function scanPageSeoApi(): Promise<
  AdminApiResponse<{ scan: PageSeoScanSummary; queue: PageSeoProcessSummary }>
> {
  return adminFetch<{ scan: PageSeoScanSummary; queue: PageSeoProcessSummary }>(
    "/api/admin/page-seo/scan",
    {
      method: "POST",
    },
  );
}

export async function generateMissingPageSeoApi(): Promise<
  AdminApiResponse<{ queued: number; queue: PageSeoProcessSummary }>
> {
  return adminFetch<{ queued: number; queue: PageSeoProcessSummary }>(
    "/api/admin/page-seo/generate-missing",
    {
      method: "POST",
    },
  );
}

export async function regenerateAutoPageSeoApi(): Promise<
  AdminApiResponse<{ queued: number; queue: PageSeoProcessSummary }>
> {
  return adminFetch<{ queued: number; queue: PageSeoProcessSummary }>(
    "/api/admin/page-seo/regenerate-auto",
    {
      method: "POST",
    },
  );
}

export async function processPageSeoQueueApi(): Promise<
  AdminApiResponse<PageSeoProcessSummary>
> {
  return adminFetch<PageSeoProcessSummary>("/api/admin/page-seo/process-queue", {
    method: "POST",
  });
}

export async function reviewPageSeoDraftApi(
  routeKey: string,
  action: "approve" | "reject",
): Promise<AdminApiResponse<{ message?: string }>> {
  return adminFetch(`/api/admin/page-seo/${encodeURIComponent(routeKey)}/review`, {
    method: "POST",
    body: JSON.stringify({ action }),
  });
}
