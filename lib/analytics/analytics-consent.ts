/**
 * @file analytics-consent.ts
 * @purpose Consent-Cookie lesen/schreiben (kein Tracking vor Einwilligung).
 */

import { cookies } from "next/headers";

import {
  CONSENT_COOKIE_NAME,
  CONSENT_MAX_AGE_SECONDS,
} from "./analytics-config";
import type { AnalyticsConsentState } from "./analytics-types";

export function parseConsentCookieValue(
  value: string | null | undefined,
): AnalyticsConsentState | null {
  if (!value?.trim()) {
    return null;
  }

  try {
    const parsed = JSON.parse(decodeURIComponent(value)) as Partial<AnalyticsConsentState>;

    if (typeof parsed.statistics !== "boolean") {
      return null;
    }

    return {
      necessary: true,
      statistics: parsed.statistics,
      marketing: Boolean(parsed.marketing),
      updatedAt:
        typeof parsed.updatedAt === "string"
          ? parsed.updatedAt
          : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function serializeConsentState(state: AnalyticsConsentState): string {
  return encodeURIComponent(JSON.stringify(state));
}

export async function getConsentFromCookies(): Promise<AnalyticsConsentState | null> {
  const cookieStore = await cookies();
  const value = cookieStore.get(CONSENT_COOKIE_NAME)?.value;

  return parseConsentCookieValue(value);
}

export function getConsentFromRequest(request: Request): AnalyticsConsentState | null {
  const cookieHeader = request.headers.get("cookie");

  if (!cookieHeader) {
    return null;
  }

  const match = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${CONSENT_COOKIE_NAME}=`));

  if (!match) {
    return null;
  }

  const value = decodeURIComponent(match.slice(CONSENT_COOKIE_NAME.length + 1));

  return parseConsentCookieValue(value);
}

export function buildConsentSetCookieHeader(state: AnalyticsConsentState): string {
  const parts = [
    `${CONSENT_COOKIE_NAME}=${serializeConsentState(state)}`,
    "Path=/",
    `Max-Age=${CONSENT_MAX_AGE_SECONDS}`,
    "SameSite=Lax",
  ];

  if (process.env.NODE_ENV === "production") {
    parts.push("Secure");
  }

  return parts.join("; ");
}
