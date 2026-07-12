/**
 * @file test-analytics-runner.ts
 */

import { PrismaClient } from "@prisma/client";

import { buildConsentSetCookieHeader, parseConsentCookieValue } from "../lib/analytics/analytics-consent";
import { ANALYTICS_FUNNELS } from "../lib/analytics/analytics-funnels";
import {
  purgeOldAnalyticsRawData,
  runAnalyticsAggregation,
} from "../lib/analytics/analytics-aggregation-service";
import {
  detectPageType,
  extractBrowserFamily,
  extractDeviceType,
  extractReferrerDomain,
  hashIpAddress,
  normalizePagePath,
} from "../lib/analytics/analytics-privacy";
import { shouldSkipAnalyticsPath } from "../lib/analytics/analytics-middleware";
import { recordBasicPageview, ingestAnalyticsBatch } from "../lib/analytics/analytics-event-service";
import { getAnalyticsFunnels, getAnalyticsOverview } from "../lib/analytics/analytics-query-service";
import { isAnalyticsExcludeAdminsEnabled } from "../lib/analytics/analytics-config";

const prisma = new PrismaClient();
const BASE_URL = process.env.TEST_BASE_URL ?? "http://localhost:3000";

let passed = 0;
let failed = 0;

function ok(label: string) {
  passed += 1;
  console.log(`  ✓ ${label}`);
}

function fail(label: string, detail?: string) {
  failed += 1;
  console.error(`  ✗ ${label}${detail ? `: ${detail}` : ""}`);
}

async function runUnitTests() {
  console.log("Unit-Tests\n");

  if (normalizePagePath("/akademie/kurse/test/")) {
    ok("Pfad-Normalisierung");
  } else {
    fail("Pfad-Normalisierung");
  }

  if (detectPageType("/akademie/kurse/wurst") === "course") {
    ok("Page-Type Kurs");
  } else {
    fail("Page-Type Kurs");
  }

  if (shouldSkipAnalyticsPath("/api/analytics/event")) {
    ok("API-Pfad übersprungen");
  } else {
    fail("API-Pfad übersprungen");
  }

  if (extractDeviceType("Mozilla/5.0 (iPhone)") === "mobile") {
    ok("Gerät Mobil");
  } else {
    fail("Gerät Mobil");
  }

  if (extractBrowserFamily("Mozilla/5.0 Chrome/120.0")) {
    ok("Browser-Familie");
  } else {
    fail("Browser-Familie");
  }

  if (extractReferrerDomain("https://google.de/search?q=test", "alles-wurst.de") === "google.de") {
    ok("Referrer-Domain");
  } else {
    fail("Referrer-Domain");
  }

  if (hashIpAddress("203.0.113.10")?.length === 16) {
    ok("IP-Hash gekürzt");
  } else {
    fail("IP-Hash gekürzt");
  }

  if (ANALYTICS_FUNNELS.length >= 4) {
    ok("Funnel-Definitionen");
  } else {
    fail("Funnel-Definitionen");
  }

  const consentHeader = buildConsentSetCookieHeader({
    necessary: true,
    statistics: true,
    marketing: false,
    updatedAt: new Date().toISOString(),
  });

  const cookieValue = consentHeader.split(";")[0]?.split("=")[1];
  const parsed = parseConsentCookieValue(cookieValue);

  if (parsed?.statistics === true) {
    ok("Consent-Cookie Roundtrip");
  } else {
    fail("Consent-Cookie Roundtrip");
  }

  if (typeof isAnalyticsExcludeAdminsEnabled() === "boolean") {
    ok("Admin-Ausschluss-Konfiguration");
  } else {
    fail("Admin-Ausschluss-Konfiguration");
  }
}

async function runDbTests() {
  console.log("\nDatenbank-Tests\n");

  const basicRequest = new Request("http://localhost/", {
    headers: { "user-agent": "TestAgent/1.0" },
  });

  await recordBasicPageview(basicRequest, "/test-analytics-basic");

  const basicEvent = await prisma.analyticsEvent.findFirst({
    where: {
      eventType: "basic_pageview",
      pagePath: "/test-analytics-basic",
    },
    orderBy: { createdAt: "desc" },
  });

  if (basicEvent?.trackingLevel === "basic") {
    ok("Basis-Pageview ohne Consent");
  } else {
    fail("Basis-Pageview ohne Consent");
  }

  const consentState = buildConsentSetCookieHeader({
    necessary: true,
    statistics: true,
    marketing: false,
    updatedAt: new Date().toISOString(),
  });

  const consentCookie = consentState.split(";")[0] ?? "";

  const statsRequest = new Request("http://localhost/", {
    headers: {
      cookie: consentCookie,
      "user-agent": "Mozilla/5.0 (Windows NT 10.0) Chrome/120.0",
    },
  });

  await ingestAnalyticsBatch(statsRequest, {
    events: [
      { eventType: "pageview", pagePath: "/test-analytics-stats" },
      { eventType: "scroll_depth", pagePath: "/test-analytics-stats", metadata: { depth: 50 } },
      { eventType: "checkout_abandon", metadata: { courseSlug: "test-kurs" } },
      { eventType: "course_started", metadata: { courseSlug: "test-kurs" } },
    ],
    pagePath: "/test-analytics-stats",
  });

  const statsEvents = await prisma.analyticsEvent.count({
    where: {
      eventType: { in: ["pageview", "scroll_depth", "checkout_abandon", "course_started"] },
      createdAt: { gte: new Date(Date.now() - 60_000) },
    },
  });

  if (statsEvents >= 4) {
    ok("Statistik-Events mit Consent");
  } else {
    fail("Statistik-Events mit Consent", String(statsEvents));
  }

  const aggregation = await runAnalyticsAggregation(1);

  if (aggregation.pageStats >= 0 && aggregation.funnelStats >= 0) {
    ok("Aggregation");
  } else {
    fail("Aggregation");
  }

  const funnels = await getAnalyticsFunnels("today");

  if (funnels.length === ANALYTICS_FUNNELS.length) {
    ok("Funnel-Auswertung");
  } else {
    fail("Funnel-Auswertung");
  }

  const overview = await getAnalyticsOverview("today");

  if (typeof overview.visitorsToday === "number") {
    ok("Overview-Query");
  } else {
    fail("Overview-Query");
  }

  const purge = await purgeOldAnalyticsRawData();

  if (typeof purge.deletedEvents === "number") {
    ok("Rohdaten-Purge");
  } else {
    fail("Rohdaten-Purge");
  }
}

async function runHttpTests() {
  console.log("\nHTTP-Tests\n");

  try {
    const denyRes = await fetch(`${BASE_URL}/api/consent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statistics: false, action: "denied" }),
    });

    if (denyRes.ok) {
      ok("Consent deny API");
    } else {
      fail("Consent deny API", String(denyRes.status));
    }

    const grantRes = await fetch(`${BASE_URL}/api/consent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statistics: true, action: "granted" }),
    });

    const grantCookie = grantRes.headers.get("set-cookie") ?? "";

    if (grantRes.ok && grantCookie.includes("aw_consent")) {
      ok("Consent grant API");
    } else {
      fail("Consent grant API");
    }

    const eventRes = await fetch(`${BASE_URL}/api/analytics/event`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: grantCookie,
      },
      body: JSON.stringify({
        events: [{ eventType: "pageview", pagePath: "/http-test" }],
        pagePath: "/http-test",
      }),
    });

    if (eventRes.ok) {
      ok("Event API mit Consent");
    } else {
      fail("Event API mit Consent", String(eventRes.status));
    }

    const noConsentRes = await fetch(`${BASE_URL}/api/analytics/event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        events: [{ eventType: "pageview", pagePath: "/blocked" }],
      }),
    });

    const noConsentJson = (await noConsentRes.json()) as { data?: { tracked?: boolean } };

    if (noConsentRes.ok && noConsentJson.data?.tracked === false) {
      ok("Event API ohne Consent blockiert");
    } else {
      fail("Event API ohne Consent blockiert");
    }

    const adminRes = await fetch(`${BASE_URL}/api/admin/analytics/overview`);

    if (adminRes.status === 401 || adminRes.status === 403) {
      ok("Admin-API geschützt");
    } else {
      fail("Admin-API geschützt", String(adminRes.status));
    }

    const revokeRes = await fetch(`${BASE_URL}/api/consent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statistics: false, action: "revoked" }),
    });

    if (revokeRes.ok) {
      ok("Consent widerrufen");
    } else {
      fail("Consent widerrufen");
    }
  } catch (error) {
    fail("HTTP-Tests", error instanceof Error ? error.message : "Server nicht erreichbar");
  }
}

async function main() {
  console.log("Analytics Tests\n");

  await runUnitTests();
  await runDbTests();
  await runHttpTests();

  await prisma.$disconnect();

  console.log(`\n${passed} bestanden, ${failed} fehlgeschlagen`);

  if (failed > 0) {
    process.exit(1);
  }
}

void main();
