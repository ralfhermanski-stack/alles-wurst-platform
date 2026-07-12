import { NextResponse } from "next/server";

import {
  purgeOldAnalyticsRawData,
  runAnalyticsAggregation,
} from "@/lib/analytics/analytics-aggregation-service";
import { getAnalyticsCronSecret } from "@/lib/analytics/analytics-config";

function isAuthorizedCron(request: Request): boolean {
  const secret = getAnalyticsCronSecret();

  if (!secret) {
    return false;
  }

  const header = request.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

export async function POST(request: Request): Promise<Response> {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const aggregation = await runAnalyticsAggregation(3);
    const purge = await purgeOldAnalyticsRawData();

    return NextResponse.json({
      success: true,
      aggregation,
      purge,
    });
  } catch (error) {
    console.error("[cron/analytics] failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Cron fehlgeschlagen.",
      },
      { status: 500 },
    );
  }
}
