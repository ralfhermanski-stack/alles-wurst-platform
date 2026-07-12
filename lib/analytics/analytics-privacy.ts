/**
 * @file analytics-privacy.ts
 * @purpose Datenschutz-Hilfen: IP-Hash, UA-Kürzung, Pfad-Normalisierung.
 */

import { createHash } from "node:crypto";

import { getSessionSecret } from "@/lib/auth/session-secret";

function analyticsHash(input: string): string {
  return createHash("sha256")
    .update(`${getSessionSecret()}:analytics:${input}`)
    .digest("hex")
    .slice(0, 16);
}

export function hashIpAddress(ip: string | null | undefined): string | null {
  if (!ip?.trim()) {
    return null;
  }

  const normalized = ip.split(",")[0]?.trim();

  if (!normalized) {
    return null;
  }

  return analyticsHash(`ip:${normalized}`);
}

export function hashUserAgent(userAgent: string | null | undefined): string | null {
  if (!userAgent?.trim()) {
    return null;
  }

  return analyticsHash(`ua:${userAgent.trim().slice(0, 120)}`);
}

export function extractBrowserFamily(
  userAgent: string | null | undefined,
): string | null {
  if (!userAgent) {
    return null;
  }

  const ua = userAgent.toLowerCase();

  if (ua.includes("edg/")) {
    return "Edge";
  }

  if (ua.includes("firefox/")) {
    return "Firefox";
  }

  if (ua.includes("chrome/") && !ua.includes("edg/")) {
    return "Chrome";
  }

  if (ua.includes("safari/") && !ua.includes("chrome/")) {
    return "Safari";
  }

  if (ua.includes("opr/") || ua.includes("opera")) {
    return "Opera";
  }

  return "Other";
}

export function extractDeviceType(
  userAgent: string | null | undefined,
): "desktop" | "mobile" | "tablet" | null {
  if (!userAgent) {
    return null;
  }

  const ua = userAgent.toLowerCase();

  if (ua.includes("ipad") || ua.includes("tablet")) {
    return "tablet";
  }

  if (ua.includes("mobi") || ua.includes("iphone") || ua.includes("android")) {
    return "mobile";
  }

  return "desktop";
}

export function extractReferrerDomain(
  referrer: string | null | undefined,
  host?: string | null,
): string | null {
  if (!referrer?.trim()) {
    return null;
  }

  try {
    const url = new URL(referrer);
    const domain = url.hostname.toLowerCase();

    if (host && domain === host.toLowerCase()) {
      return null;
    }

    return domain;
  } catch {
    return null;
  }
}

export function normalizePagePath(pathname: string): string {
  const withoutQuery = pathname.split("?")[0] ?? pathname;
  const normalized = withoutQuery.replace(/\/+$/, "") || "/";

  return normalized
    .replace(
      /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
      "/:id",
    )
    .replace(/\/\d+(?=\/|$)/g, "/:id");
}

export function detectPageType(pathname: string): string {
  const path = normalizePagePath(pathname);

  if (path === "/") {
    return "home";
  }

  if (path.startsWith("/akademie/kurse/")) {
    return "course";
  }

  if (path.startsWith("/kaufen")) {
    return "checkout";
  }

  if (path.startsWith("/anmelden") || path.startsWith("/registrieren")) {
    return "auth";
  }

  if (path.startsWith("/mein-bereich")) {
    return "member";
  }

  if (path.startsWith("/admin")) {
    return "admin";
  }

  if (path.startsWith("/community") || path.startsWith("/forum")) {
    return "forum";
  }

  if (path.startsWith("/werkstatt")) {
    return "workshop";
  }

  if (path.startsWith("/magazin")) {
    return "magazine";
  }

  if (path.startsWith("/suche")) {
    return "search";
  }

  return "page";
}

export function getClientIpFromRequest(request: Request): string | null {
  const forwarded = request.headers.get("x-forwarded-for");

  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? null;
  }

  const realIp = request.headers.get("x-real-ip");

  return realIp?.trim() ?? null;
}

export function getCountryCodeFromRequest(
  request: Request,
): string | null {
  const country =
    request.headers.get("cf-ipcountry") ??
    request.headers.get("x-vercel-ip-country");

  if (!country || country === "XX" || country.length !== 2) {
    return null;
  }

  return country.toUpperCase();
}
