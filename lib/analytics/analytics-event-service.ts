/**
 * @file analytics-event-service.ts
 * @purpose Event-Ingestion (Basis + Statistik-Stufen).
 */

import type { AnalyticsTrackingLevel, Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { verifySessionToken } from "@/lib/auth/session-token";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";

import { isAnalyticsExcludeAdminsEnabled } from "./analytics-config";
import { getConsentFromRequest } from "./analytics-consent";
import type { AnalyticsBatchInput, AnalyticsEventInput } from "./analytics-types";
import {
  detectPageType,
  extractBrowserFamily,
  extractDeviceType,
  extractReferrerDomain,
  getClientIpFromRequest,
  getCountryCodeFromRequest,
  hashIpAddress,
  normalizePagePath,
} from "./analytics-privacy";
import { shouldSkipAnalyticsPath } from "./analytics-middleware";
import {
  buildAnalyticsSessionCookieHeader,
  getAnalyticsSessionKeyFromRequest,
  getOrCreateAnalyticsSession,
  touchAnalyticsSession,
} from "./analytics-session-service";

type IngestContext = {
  request: Request;
  userId?: string | null;
  isAdmin?: boolean;
};

async function resolveUserFromRequest(
  request: Request,
): Promise<{ userId: string | null; isAdmin: boolean }> {
  const cookieHeader = request.headers.get("cookie");

  if (!cookieHeader) {
    return { userId: null, isAdmin: false };
  }

  const match = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${SESSION_COOKIE_NAME}=`));

  if (!match) {
    return { userId: null, isAdmin: false };
  }

  const token = decodeURIComponent(match.slice(SESSION_COOKIE_NAME.length + 1));
  const payload = await verifySessionToken(token);

  return {
    userId: payload?.userId ?? null,
    isAdmin:
      payload?.systemRole === "ADMIN" || payload?.systemRole === "SUPERADMIN",
  };
}

function shouldTrackUser(isAdmin: boolean): boolean {
  if (!isAdmin) {
    return true;
  }

  return !isAnalyticsExcludeAdminsEnabled();
}

export async function recordBasicPageview(
  request: Request,
  pathname: string,
  httpStatus = 200,
): Promise<void> {
  if (shouldSkipAnalyticsPath(pathname)) {
    return;
  }

  const consent = getConsentFromRequest(request);

  if (consent?.statistics) {
    return;
  }

  const host = request.headers.get("host");
  const referrer = request.headers.get("referer");
  const pagePath = normalizePagePath(pathname);
  const pageType = detectPageType(pagePath);
  const referrerDomain = extractReferrerDomain(referrer, host);

  await prisma.analyticsEvent.create({
    data: {
      trackingLevel: "basic",
      eventType: "basic_pageview",
      pagePath,
      pageType,
      referrerDomain,
      metadataJson: { httpStatus },
    },
  });
}

export async function ingestAnalyticsBatch(
  request: Request,
  input: AnalyticsBatchInput,
): Promise<{ sessionCookie?: string }> {
  const consent = getConsentFromRequest(request);

  if (!consent?.statistics) {
    return {};
  }

  const { userId, isAdmin } = await resolveUserFromRequest(request);

  if (!shouldTrackUser(isAdmin)) {
    return {};
  }

  const events = input.events?.filter((event) => event.eventType?.trim()) ?? [];

  if (events.length === 0) {
    return {};
  }

  const userAgent = request.headers.get("user-agent");
  const host = request.headers.get("host");
  const referrer =
    input.referrer ?? request.headers.get("referer") ?? null;
  const referrerDomain = extractReferrerDomain(referrer, host);
  const deviceType = extractDeviceType(userAgent);
  const browserFamily = extractBrowserFamily(userAgent);
  const countryCode = getCountryCodeFromRequest(request);

  const firstPagePath = normalizePagePath(
    input.pagePath ??
      events.find((event) => event.pagePath)?.pagePath ??
      "/",
  );

  let sessionKey = getAnalyticsSessionKeyFromRequest(request);
  const session = await getOrCreateAnalyticsSession({
    request,
    sessionKey,
    userId,
    entryPage: firstPagePath,
    referrer,
  });

  const needsNewCookie = !sessionKey || sessionKey !== session.sessionKey;

  for (const event of events) {
    await createStatisticsEvent({
      sessionId: session.id,
      userId,
      event,
      referrerDomain,
      deviceType,
      browserFamily,
      countryCode,
    });
  }

  const pageviewCount = events.filter(
    (event) => event.eventType === "pageview",
  ).length;

  const durationSeconds = events.reduce((sum, event) => {
    return sum + Math.max(0, event.durationSeconds ?? 0);
  }, 0);

  await touchAnalyticsSession({
    sessionId: session.id,
    pagePath: events.at(-1)?.pagePath
      ? normalizePagePath(events.at(-1)!.pagePath!)
      : firstPagePath,
    durationSeconds,
    incrementPageviews: pageviewCount > 0,
  });

  if (needsNewCookie) {
    return {
      sessionCookie: buildAnalyticsSessionCookieHeader(session.sessionKey),
    };
  }

  return {};
}

async function createStatisticsEvent(params: {
  sessionId: string;
  userId: string | null;
  event: AnalyticsEventInput;
  referrerDomain: string | null;
  deviceType: ReturnType<typeof extractDeviceType>;
  browserFamily: string | null;
  countryCode: string | null;
}) {
  const pagePath = params.event.pagePath
    ? normalizePagePath(params.event.pagePath)
    : null;

  const pageType =
    params.event.pageType ??
    (pagePath ? detectPageType(pagePath) : null);

  await prisma.analyticsEvent.create({
    data: {
      sessionId: params.sessionId,
      userId: params.userId,
      trackingLevel: "statistics" satisfies AnalyticsTrackingLevel,
      eventType: params.event.eventType,
      pagePath,
      pageType,
      referrerDomain: params.event.referrerDomain ?? params.referrerDomain,
      deviceType: params.deviceType,
      browserFamily: params.browserFamily,
      countryCode: params.countryCode,
      metadataJson: (params.event.metadata ?? undefined) as
        | Prisma.InputJsonValue
        | undefined,
    },
  });
}

export async function logConsentChange(params: {
  request: Request;
  statisticsConsent: boolean;
  marketingConsent: boolean;
  action: "granted" | "denied" | "updated" | "revoked";
}): Promise<void> {
  const ipHash = hashIpAddress(getClientIpFromRequest(params.request));

  await prisma.analyticsConsentLog.create({
    data: {
      statisticsConsent: params.statisticsConsent,
      marketingConsent: params.marketingConsent,
      action: params.action,
      ipHash,
    },
  });
}

export async function trackServerEvent(
  request: Request,
  event: AnalyticsEventInput,
): Promise<void> {
  await ingestAnalyticsBatch(request, {
    events: [event],
    pagePath: event.pagePath,
  });
}
