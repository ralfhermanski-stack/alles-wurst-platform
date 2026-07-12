import { NextResponse } from "next/server";

import { buildConsentSetCookieHeader, getConsentFromRequest } from "@/lib/analytics/analytics-consent";
import { logConsentChange } from "@/lib/analytics/analytics-event-service";
import type { AnalyticsConsentState } from "@/lib/analytics/analytics-types";
import { parseJsonBody } from "@/lib/tools/recipe-api-utils";

export async function GET(request: Request): Promise<Response> {
  const consent = getConsentFromRequest(request);

  return NextResponse.json({
    success: true,
    data: consent ?? {
      necessary: true,
      statistics: false,
      marketing: false,
      updatedAt: null,
    },
  });
}

export async function POST(request: Request): Promise<Response> {
  const body = await parseJsonBody(request);

  if (!body || typeof body.statistics !== "boolean") {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Ungültiger Consent-Body.",
        },
      },
      { status: 400 },
    );
  }

  const statistics = Boolean(body.statistics);
  const marketing = Boolean(body.marketing);
  const action =
    (typeof body.action === "string" ? body.action : null) ??
    (statistics ? "granted" : "denied");

  const state: AnalyticsConsentState = {
    necessary: true,
    statistics,
    marketing,
    updatedAt: new Date().toISOString(),
  };

  try {
    await logConsentChange({
      request,
      statisticsConsent: statistics,
      marketingConsent: marketing,
      action: action as "granted" | "denied" | "updated" | "revoked",
    });
  } catch (error) {
    console.error("[consent] Protokollierung fehlgeschlagen:", error);
  }

  const response = NextResponse.json({ success: true, data: state });
  response.headers.append("Set-Cookie", buildConsentSetCookieHeader(state));

  if (!statistics) {
    response.headers.append(
      "Set-Cookie",
      "aw_analytics_sid=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax",
    );
  }

  return response;
}
