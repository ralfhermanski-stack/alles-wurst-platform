/**
 * @file admin-analytics-client.ts
 * @purpose Client für Admin-Analytics-APIs.
 */

import { adminFetch, type AdminApiResponse } from "./admin-fetch";
import type {
  AnalyticsCheckoutStat,
  AnalyticsCourseStat,
  AnalyticsFunnelResult,
  AnalyticsOverviewStats,
  AnalyticsPageStat,
  AnalyticsTimeRange,
} from "@/lib/analytics/analytics-types";

function buildRangeQuery(
  range: AnalyticsTimeRange,
  from?: string,
  to?: string,
): string {
  const params = new URLSearchParams({ range });

  if (range === "custom" && from) {
    params.set("from", from);
  }

  if (range === "custom" && to) {
    params.set("to", to);
  }

  return `?${params.toString()}`;
}

export async function fetchAdminAnalyticsOverviewApi(
  range: AnalyticsTimeRange = "last_7_days",
  from?: string,
  to?: string,
): Promise<AdminApiResponse<AnalyticsOverviewStats>> {
  return adminFetch<AnalyticsOverviewStats>(
    `/api/admin/analytics/overview${buildRangeQuery(range, from, to)}`,
  );
}

export async function fetchAdminAnalyticsPagesApi(
  range: AnalyticsTimeRange = "last_7_days",
  from?: string,
  to?: string,
): Promise<
  AdminApiResponse<{ pages: AnalyticsPageStat[]; searchTerms: { term: string; count: number }[] }>
> {
  return adminFetch(`/api/admin/analytics/pages${buildRangeQuery(range, from, to)}`);
}

export async function fetchAdminAnalyticsFunnelsApi(
  range: AnalyticsTimeRange = "last_7_days",
  from?: string,
  to?: string,
): Promise<AdminApiResponse<AnalyticsFunnelResult[]>> {
  return adminFetch<AnalyticsFunnelResult[]>(
    `/api/admin/analytics/funnels${buildRangeQuery(range, from, to)}`,
  );
}

export async function fetchAdminAnalyticsCoursesApi(
  range: AnalyticsTimeRange = "last_7_days",
  from?: string,
  to?: string,
): Promise<AdminApiResponse<AnalyticsCourseStat[]>> {
  return adminFetch<AnalyticsCourseStat[]>(
    `/api/admin/analytics/courses${buildRangeQuery(range, from, to)}`,
  );
}

export async function fetchAdminAnalyticsCheckoutApi(
  range: AnalyticsTimeRange = "last_7_days",
  from?: string,
  to?: string,
): Promise<AdminApiResponse<AnalyticsCheckoutStat>> {
  return adminFetch<AnalyticsCheckoutStat>(
    `/api/admin/analytics/checkout${buildRangeQuery(range, from, to)}`,
  );
}
