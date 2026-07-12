/**
 * @file ip-block-service.ts
 * @purpose Intelligente IP-Sperren (stufenweise).
 */

import type { IpBlockLevel } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

import { recordSecurityEvent } from "./security-event-service";
import { getSecuritySettings } from "./security-settings-service";
import type { IpBlockCheckResult, SecurityRequestContext } from "./security-types";

const THIRTY_MINUTES_MS = 30 * 60_000;
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60_000;

export async function checkIpBlock(
  ipAddress: string | null,
): Promise<IpBlockCheckResult> {
  if (!ipAddress) {
    return { blocked: false, level: null };
  }

  const now = new Date();

  const activeBlock = await prisma.blockedIp.findFirst({
    where: {
      ipAddress,
      isActive: true,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    orderBy: { blockedAt: "desc" },
  });

  if (activeBlock) {
    if (
      activeBlock.level === "permanent"
      || activeBlock.level === "extended_24h"
      || activeBlock.level === "temporary_30m"
    ) {
      const retryAfterSeconds = activeBlock.expiresAt
        ? Math.max(0, Math.ceil((activeBlock.expiresAt.getTime() - now.getTime()) / 1000))
        : undefined;

      return {
        blocked: true,
        level: activeBlock.level,
        retryAfterSeconds,
      };
    }

    if (activeBlock.level === "captcha") {
      return {
        blocked: false,
        level: "captcha",
        requireCaptcha: true,
      };
    }

    if (activeBlock.level === "throttle") {
      return {
        blocked: false,
        level: "throttle",
        throttleMs: 2000,
      };
    }
  }

  return { blocked: false, level: null };
}

export async function evaluateAndApplyIpBlock(input: {
  ipAddress: string;
  context: SecurityRequestContext;
  userId?: string | null;
}): Promise<IpBlockCheckResult> {
  const settings = await getSecuritySettings();
  const failCount = await prisma.securityEvent.count({
    where: {
      ipAddress: input.ipAddress,
      eventType: { in: ["LOGIN_FAILED", "ADMIN_LOGIN_FAILED", "TOTP_FAILED"] },
      createdAt: { gte: new Date(Date.now() - 60 * 60_000) },
    },
  });

  let level: IpBlockLevel | null = null;
  let expiresAt: Date | null = null;
  let reason: string | null = null;

  if (failCount >= settings.loginFailThreshold24h) {
    level = "extended_24h";
    expiresAt = new Date(Date.now() + TWENTY_FOUR_HOURS_MS);
    reason = `${failCount} Fehlversuche in 60 Minuten`;
  } else if (failCount >= settings.loginFailThreshold30m) {
    level = "temporary_30m";
    expiresAt = new Date(Date.now() + THIRTY_MINUTES_MS);
    reason = `${failCount} Fehlversuche in 60 Minuten`;
  } else if (failCount >= settings.loginFailThresholdCaptcha) {
    level = "captcha";
    expiresAt = new Date(Date.now() + THIRTY_MINUTES_MS);
    reason = `${failCount} Fehlversuche — Captcha erforderlich`;
  } else if (failCount >= settings.loginFailThresholdThrottle) {
    level = "throttle";
    expiresAt = new Date(Date.now() + 15 * 60_000);
    reason = `${failCount} Fehlversuche — Anfragen verlangsamt`;
  }

  if (!level) {
    return checkIpBlock(input.ipAddress);
  }

  await prisma.blockedIp.updateMany({
    where: {
      ipAddress: input.ipAddress,
      isActive: true,
      level: { in: ["throttle", "captcha", "temporary_30m", "extended_24h"] },
    },
    data: { isActive: false, revokedAt: new Date() },
  });

  await prisma.blockedIp.create({
    data: {
      ipAddress: input.ipAddress,
      level,
      reason,
      expiresAt,
    },
  });

  await recordSecurityEvent({
    eventType: "IP_BLOCKED",
    riskLevel: level === "extended_24h" ? "critical" : "high",
    userId: input.userId,
    context: input.context,
    description: reason,
    metadata: { level, failCount },
  });

  return checkIpBlock(input.ipAddress);
}

export async function blockIpManually(input: {
  ipAddress: string;
  level: IpBlockLevel;
  reason?: string;
  notes?: string;
  createdByUserId?: string;
  permanent?: boolean;
}): Promise<void> {
  const expiresAt =
    input.permanent || input.level === "permanent"
      ? null
      : input.level === "extended_24h"
        ? new Date(Date.now() + TWENTY_FOUR_HOURS_MS)
        : input.level === "temporary_30m"
          ? new Date(Date.now() + THIRTY_MINUTES_MS)
          : new Date(Date.now() + THIRTY_MINUTES_MS);

  await prisma.blockedIp.create({
    data: {
      ipAddress: input.ipAddress,
      level: input.permanent ? "permanent" : input.level,
      reason: input.reason,
      notes: input.notes,
      createdByUserId: input.createdByUserId,
      expiresAt,
    },
  });
}

export async function unblockIp(
  ipAddress: string,
  actorUserId?: string,
  notes?: string,
): Promise<void> {
  await prisma.blockedIp.updateMany({
    where: { ipAddress, isActive: true },
    data: { isActive: false, revokedAt: new Date(), notes },
  });

  if (actorUserId) {
    const { writeSecurityAuditLog } = await import("./security-audit-service");
    await writeSecurityAuditLog({
      action: "IP_UNBLOCK",
      actorUserId,
      ipAddress,
      description: `IP ${ipAddress} entsperrt`,
      metadata: { notes },
    });
  }
}

export async function listBlockedIps(input?: {
  activeOnly?: boolean;
  page?: number;
  pageSize?: number;
}) {
  const page = Math.max(1, input?.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, input?.pageSize ?? 25));
  const where = input?.activeOnly ? { isActive: true } : {};

  const [items, total] = await Promise.all([
    prisma.blockedIp.findMany({
      where,
      orderBy: { blockedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        createdByUser: { select: { id: true, email: true } },
      },
    }),
    prisma.blockedIp.count({ where }),
  ]);

  return { items, total };
}

export async function countActiveBlockedIps(): Promise<number> {
  const now = new Date();

  return prisma.blockedIp.count({
    where: {
      isActive: true,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
  });
}
