import { NextResponse } from "next/server";

import { ingestAnalyticsBatch } from "@/lib/analytics/analytics-event-service";
import { getConsentFromRequest } from "@/lib/analytics/analytics-consent";
import type { AnalyticsBatchInput } from "@/lib/analytics/analytics-types";
import { parseJsonBody } from "@/lib/tools/recipe-api-utils";

export async function POST(request: Request): Promise<Response> {
  const consent = getConsentFromRequest(request);

  if (!consent?.statistics) {
    return NextResponse.json({ success: true, data: { tracked: false } });
  }

  const body = await parseJsonBody(request);

  if (!body || !Array.isArray(body.events)) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Ungültiger Event-Body.",
        },
      },
      { status: 400 },
    );
  }

  try {
    const result = await ingestAnalyticsBatch(request, body as AnalyticsBatchInput);
    const response = NextResponse.json({
      success: true,
      data: { tracked: true },
    });

    if (result.sessionCookie) {
      response.headers.append("Set-Cookie", result.sessionCookie);
    }

    return response;
  } catch (error) {
    console.error("[analytics/event] failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Analytics-Event konnte nicht gespeichert werden.",
        },
      },
      { status: 500 },
    );
  }
}
