/**
 * @file social-media-cron-auth.ts
 */

import { timingSafeEqual } from "node:crypto";

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 10;

const requestLog = new Map<string, { count: number; resetAt: number }>();

function getClientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() ?? "local";
}

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const entry = requestLog.get(key);

  if (!entry || entry.resetAt < now) {
    requestLog.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  entry.count += 1;
  return entry.count > RATE_LIMIT_MAX;
}

function safeEqualStrings(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);

  if (bufA.length !== bufB.length) {
    return false;
  }

  return timingSafeEqual(bufA, bufB);
}

export function authorizeSocialMediaCron(request: Request): {
  authorized: boolean;
  status: 401 | 403 | 429;
  reason?: string;
} {
  const clientKey = getClientKey(request);

  if (isRateLimited(clientKey)) {
    return { authorized: false, status: 429, reason: "Zu viele Anfragen." };
  }

  const secret = process.env.SOCIAL_MEDIA_CRON_SECRET?.trim();

  if (!secret) {
    return {
      authorized: false,
      status: 401,
      reason: "Cron-Secret ist nicht konfiguriert.",
    };
  }

  const header = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;

  if (!safeEqualStrings(header, expected)) {
    return { authorized: false, status: 401, reason: "Unauthorized" };
  }

  return { authorized: true, status: 401 };
}

export const SOCIAL_MEDIA_CRON_ROUTE = "/api/cron/social-media";
export const SOCIAL_MEDIA_CRON_METHOD = "POST";
export const SOCIAL_MEDIA_CRON_AUTH_HEADER = "Authorization: Bearer <SOCIAL_MEDIA_CRON_SECRET>";
