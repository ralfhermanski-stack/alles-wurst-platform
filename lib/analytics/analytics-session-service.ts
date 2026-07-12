/**
 * @file analytics-session-service.ts
 * @purpose Session-Verwaltung (nur mit Statistik-Consent).
 */

import { randomBytes } from "node:crypto";

import { prisma } from "@/lib/db/prisma";

import {
  ANALYTICS_SESSION_COOKIE_NAME,
  ANALYTICS_SESSION_MAX_AGE_SECONDS,
} from "./analytics-config";
import {
  extractBrowserFamily,
  extractDeviceType,
  extractReferrerDomain,
  getCountryCodeFromRequest,
} from "./analytics-privacy";

export function createAnalyticsSessionKey(): string {
  return randomBytes(24).toString("hex");
}

export function buildAnalyticsSessionCookieHeader(sessionKey: string): string {
  const parts = [
    `${ANALYTICS_SESSION_COOKIE_NAME}=${encodeURIComponent(sessionKey)}`,
    "Path=/",
    `Max-Age=${ANALYTICS_SESSION_MAX_AGE_SECONDS}`,
    "HttpOnly",
    "SameSite=Lax",
  ];

  if (process.env.NODE_ENV === "production") {
    parts.push("Secure");
  }

  return parts.join("; ");
}

export function getAnalyticsSessionKeyFromRequest(
  request: Request,
): string | null {
  const cookieHeader = request.headers.get("cookie");

  if (!cookieHeader) {
    return null;
  }

  const match = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${ANALYTICS_SESSION_COOKIE_NAME}=`));

  if (!match) {
    return null;
  }

  return decodeURIComponent(
    match.slice(ANALYTICS_SESSION_COOKIE_NAME.length + 1),
  );
}

export async function getOrCreateAnalyticsSession(params: {
  request: Request;
  sessionKey?: string | null;
  userId?: string | null;
  entryPage?: string | null;
  referrer?: string | null;
}) {
  const userAgent = params.request.headers.get("user-agent");
  const host = params.request.headers.get("host");
  const referrerDomain = extractReferrerDomain(params.referrer, host);
  const deviceType = extractDeviceType(userAgent);
  const browserFamily = extractBrowserFamily(userAgent);
  const countryCode = getCountryCodeFromRequest(params.request);

  let sessionKey = params.sessionKey?.trim() || null;

  if (sessionKey) {
    const existing = await prisma.analyticsSession.findUnique({
      where: { sessionKey },
    });

    if (existing) {
      return prisma.analyticsSession.update({
        where: { id: existing.id },
        data: {
          lastActivityAt: new Date(),
          userId: params.userId ?? existing.userId,
          exitPage: params.entryPage ?? existing.exitPage,
        },
      });
    }
  }

  sessionKey = createAnalyticsSessionKey();

  return prisma.analyticsSession.create({
    data: {
      sessionKey,
      userId: params.userId ?? null,
      entryPage: params.entryPage ?? null,
      exitPage: params.entryPage ?? null,
      referrerDomain,
      deviceType,
      browserFamily,
      countryCode,
    },
  });
}

export async function touchAnalyticsSession(params: {
  sessionId: string;
  pagePath?: string | null;
  durationSeconds?: number;
  incrementPageviews?: boolean;
}) {
  const session = await prisma.analyticsSession.findUnique({
    where: { id: params.sessionId },
  });

  if (!session) {
    return null;
  }

  return prisma.analyticsSession.update({
    where: { id: session.id },
    data: {
      lastActivityAt: new Date(),
      exitPage: params.pagePath ?? session.exitPage,
      pageviewCount: params.incrementPageviews
        ? session.pageviewCount + 1
        : session.pageviewCount,
      durationSeconds:
        session.durationSeconds + Math.max(0, params.durationSeconds ?? 0),
    },
  });
}
