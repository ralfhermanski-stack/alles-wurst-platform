import { NextResponse } from "next/server";

import { adminGuardResponse } from "@/lib/admin/admin-api-utils";
import {
  getAnalyticsPages,
  getTopSearchTerms,
} from "@/lib/analytics/analytics-query-service";
import type { AnalyticsTimeRange } from "@/lib/analytics/analytics-types";

export async function GET(request: Request): Promise<Response> {
  const guard = await adminGuardResponse(request);

  if (guard) {
    return guard;
  }

  const url = new URL(request.url);
  const preset = (url.searchParams.get("range") ??
    "last_7_days") as AnalyticsTimeRange;
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  const [pages, searchTerms] = await Promise.all([
    getAnalyticsPages(preset, from, to),
    getTopSearchTerms(preset, from, to),
  ]);

  return NextResponse.json({
    success: true,
    data: { pages, searchTerms },
  });
}
