/**
 * @file membership-cron-auth.ts
 */

import { timingSafeEqual } from "node:crypto";

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 10;
const requestLog = new Map<string, { count: number; resetAt: number }>();

function getClientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() ?? "local";
}

function safeEqualStrings(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

export const MEMBERSHIP_CRON_ROUTE = "/api/cron/membership-renewals";

export function authorizeMembershipCron(request: Request): {
  authorized: boolean;
  status: 401 | 429;
} {
  const clientKey = getClientKey(request);
  const entry = requestLog.get(clientKey);
  const now = Date.now();

  if (!entry || entry.resetAt < now) {
    requestLog.set(clientKey, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
  } else {
    entry.count += 1;
    if (entry.count > RATE_LIMIT_MAX) {
      return { authorized: false, status: 429 };
    }
  }

  const secret =
    process.env.MEMBERSHIP_CRON_SECRET?.trim() ??
    process.env.LEGAL_CRON_SECRET?.trim();

  if (!secret || secret.length < 32) {
    return { authorized: false, status: 401 };
  }

  const header = request.headers.get("authorization") ?? "";
  if (!safeEqualStrings(header, `Bearer ${secret}`)) {
    return { authorized: false, status: 401 };
  }

  return { authorized: true, status: 401 };
}
