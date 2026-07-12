/**
 * @file rate-limit-service.ts
 * @purpose Persistentes Rate-Limiting (DB-basiert, IP + User + Session).
 */

import { prisma } from "@/lib/db/prisma";

import { recordSecurityEvent } from "./security-event-service";
import { getSecuritySettings } from "./security-settings-service";
import type { RateLimitScope, SecurityRequestContext } from "./security-types";

type RateLimitConfig = {
  windowMs: number;
  maxRequests: number;
};

const SCOPE_CONFIG: Record<RateLimitScope, RateLimitConfig> = {
  login: { windowMs: 60_000, maxRequests: 20 },
  admin_login: { windowMs: 60_000, maxRequests: 15 },
  register: { windowMs: 60_000, maxRequests: 5 },
  password_reset: { windowMs: 60_000, maxRequests: 5 },
  password_reset_confirm: { windowMs: 60_000, maxRequests: 10 },
  tickets: { windowMs: 60_000, maxRequests: 10 },
  forum: { windowMs: 60_000, maxRequests: 30 },
  reviews: { windowMs: 60_000, maxRequests: 5 },
  comments: { windowMs: 60_000, maxRequests: 20 },
  uploads: { windowMs: 60_000, maxRequests: 10 },
  pdf: { windowMs: 60_000, maxRequests: 10 },
  api: { windowMs: 60_000, maxRequests: 120 },
  openai: { windowMs: 60_000, maxRequests: 5 },
};

const buckets = new Map<string, { count: number; resetAt: number }>();

function buildBucketKey(
  scope: RateLimitScope,
  ipAddress: string | null,
  userId?: string | null,
): string {
  return `${scope}:${userId ?? "anon"}:${ipAddress ?? "unknown"}`;
}

async function resolveMaxForScope(scope: RateLimitScope): Promise<number> {
  const settings = await getSecuritySettings();

  switch (scope) {
    case "login":
    case "admin_login":
      return settings.loginRateLimitPerIp;
    case "register":
      return settings.registerRateLimitPerIp;
    case "password_reset":
    case "password_reset_confirm":
      return settings.passwordResetRateLimitPerIp;
    case "api":
      return settings.apiRateLimitPerIp;
    default:
      return SCOPE_CONFIG[scope].maxRequests;
  }
}

export async function checkRateLimit(input: {
  scope: RateLimitScope;
  ipAddress: string | null;
  userId?: string | null;
  context?: SecurityRequestContext;
}): Promise<{ allowed: boolean; retryAfterMs?: number }> {
  const config = SCOPE_CONFIG[input.scope];
  const maxRequests = await resolveMaxForScope(input.scope);
  const key = buildBucketKey(input.scope, input.ipAddress, input.userId);
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + config.windowMs });
    return { allowed: true };
  }

  if (bucket.count >= maxRequests) {
    if (input.context) {
      void recordSecurityEvent({
        eventType: "RATE_LIMIT_EXCEEDED",
        riskLevel: "medium",
        userId: input.userId,
        context: input.context,
        description: `Rate-Limit überschritten: ${input.scope}`,
        metadata: { scope: input.scope, maxRequests },
      });
    }

    return { allowed: false, retryAfterMs: bucket.resetAt - now };
  }

  bucket.count += 1;
  return { allowed: true };
}

export async function countApiAttacksToday(): Promise<number> {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  return prisma.securityEvent.count({
    where: {
      eventType: { in: ["API_ABUSE", "RATE_LIMIT_EXCEEDED", "MASS_REQUEST"] },
      createdAt: { gte: start },
    },
  });
}
