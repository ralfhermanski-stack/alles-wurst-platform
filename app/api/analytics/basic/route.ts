import { NextResponse } from "next/server";

import { recordBasicPageview } from "@/lib/analytics/analytics-event-service";
import { shouldSkipAnalyticsPath } from "@/lib/analytics/analytics-middleware";

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as { pathname?: string; status?: number };
    const pathname = body.pathname?.trim();

    if (!pathname || shouldSkipAnalyticsPath(pathname)) {
      return NextResponse.json({ success: true, data: { recorded: false } });
    }

    await recordBasicPageview(request, pathname, body.status ?? 200);

    return NextResponse.json({ success: true, data: { recorded: true } });
  } catch (error) {
    console.error("[analytics/basic] failed:", error);

    return NextResponse.json({ success: true, data: { recorded: false } });
  }
}
