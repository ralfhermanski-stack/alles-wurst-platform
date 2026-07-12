/**
 * @file security-event-service.ts
 * @purpose Erfassung und Abfrage von Sicherheitsereignissen.
 */

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

import type {
  SecurityEventType,
  SecurityRequestContext,
  SecurityRiskLevel,
} from "./security-types";

export async function recordSecurityEvent(input: {
  eventType: SecurityEventType;
  riskLevel?: SecurityRiskLevel;
  userId?: string | null;
  context: SecurityRequestContext;
  description?: string | null;
  metadata?: Record<string, unknown> | null;
}): Promise<void> {
  try {
    await prisma.securityEvent.create({
      data: {
        eventType: input.eventType,
        riskLevel: input.riskLevel ?? inferRiskLevel(input.eventType),
        userId: input.userId ?? null,
        ipAddress: input.context.ipAddress,
        userAgent: input.context.userAgent,
        browser: input.context.browser,
        os: input.context.os,
        countryCode: input.context.countryCode,
        region: input.context.region,
        asn: input.context.asn,
        provider: input.context.provider,
        path: input.context.path,
        method: input.context.method,
        description: input.description ?? null,
        metadata: input.metadata as Prisma.InputJsonValue | undefined,
      },
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[security-event] Speichern fehlgeschlagen", error);
    }
  }
}

function inferRiskLevel(eventType: SecurityEventType): SecurityRiskLevel {
  switch (eventType) {
    case "ADMIN_LOGIN_FAILED":
    case "PASSWORD_RESET_ABUSE":
    case "API_ABUSE":
    case "FORM_MANIPULATION":
      return "high";
    case "MASS_REQUEST":
    case "BOT_ACTIVITY":
    case "REGISTRATION_SPAM":
      return "medium";
    case "SECURITY_WARNING":
    case "IP_BLOCKED":
      return "critical";
    default:
      return "low";
  }
}

export async function countFailedLoginsToday(): Promise<number> {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  return prisma.securityEvent.count({
    where: {
      eventType: { in: ["LOGIN_FAILED", "ADMIN_LOGIN_FAILED"] },
      createdAt: { gte: start },
    },
  });
}

export async function countSecurityEventsByType(
  eventType: SecurityEventType,
  since?: Date,
): Promise<number> {
  return prisma.securityEvent.count({
    where: {
      eventType,
      ...(since ? { createdAt: { gte: since } } : {}),
    },
  });
}

export async function getTopAttackCountries(limit = 10): Promise<
  Array<{ countryCode: string; count: number }>
> {
  const since = new Date();
  since.setDate(since.getDate() - 7);

  const rows = await prisma.securityEvent.groupBy({
    by: ["countryCode"],
    where: {
      createdAt: { gte: since },
      countryCode: { not: null },
      eventType: {
        in: [
          "LOGIN_FAILED",
          "ADMIN_LOGIN_FAILED",
          "API_ABUSE",
          "MASS_REQUEST",
          "BOT_ACTIVITY",
        ],
      },
    },
    _count: { _all: true },
    orderBy: { _count: { countryCode: "desc" } },
    take: limit,
  });

  return rows
    .filter((row) => row.countryCode)
    .map((row) => ({
      countryCode: row.countryCode as string,
      count: row._count._all,
    }));
}

export async function listSecurityEvents(input: {
  page?: number;
  pageSize?: number;
  eventType?: SecurityEventType;
  riskLevel?: SecurityRiskLevel;
  ipAddress?: string;
}): Promise<{
  items: Awaited<ReturnType<typeof prisma.securityEvent.findMany>>;
  total: number;
}> {
  const page = Math.max(1, input.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, input.pageSize ?? 25));
  const where: Prisma.SecurityEventWhereInput = {};

  if (input.eventType) where.eventType = input.eventType;
  if (input.riskLevel) where.riskLevel = input.riskLevel;
  if (input.ipAddress) where.ipAddress = { contains: input.ipAddress };

  const [items, total] = await Promise.all([
    prisma.securityEvent.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        user: { select: { id: true, email: true, systemRole: true } },
      },
    }),
    prisma.securityEvent.count({ where }),
  ]);

  return { items, total };
}

export async function countRecentFailedLoginsForIp(
  ipAddress: string,
  windowMinutes = 60,
): Promise<number> {
  const since = new Date(Date.now() - windowMinutes * 60_000);

  return prisma.securityEvent.count({
    where: {
      ipAddress,
      eventType: { in: ["LOGIN_FAILED", "ADMIN_LOGIN_FAILED", "TOTP_FAILED"] },
      createdAt: { gte: since },
    },
  });
}
