/**
 * @file security-dashboard-service.ts
 * @purpose Kennzahlen für die Sicherheitszentrale.
 */

import { prisma } from "@/lib/db/prisma";

import { countActiveBlockedIps } from "./ip-block-service";
import { countApiAttacksToday } from "./rate-limit-service";
import { countFailedLoginsToday, getTopAttackCountries } from "./security-event-service";
import { countActiveAdminSessions } from "./session-registry-service";
import type { SecurityDashboardStats } from "./security-types";

export async function getSecurityDashboardStats(): Promise<SecurityDashboardStats> {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const [
    failedLoginsToday,
    blockedIps,
    activeAdmins,
    suspiciousRegistrations,
    passwordResetRequests,
    apiAttacks,
    securityWarnings,
    topAttackCountries,
  ] = await Promise.all([
    countFailedLoginsToday(),
    countActiveBlockedIps(),
    countActiveAdminSessions(),
    prisma.securityEvent.count({
      where: {
        eventType: "REGISTRATION_SPAM",
        createdAt: { gte: start },
      },
    }),
    prisma.securityEvent.count({
      where: {
        eventType: "PASSWORD_RESET_REQUEST",
        createdAt: { gte: start },
      },
    }),
    countApiAttacksToday(),
    prisma.securityEvent.count({
      where: {
        eventType: "SECURITY_WARNING",
        createdAt: { gte: start },
      },
    }),
    getTopAttackCountries(8),
  ]);

  return {
    failedLoginsToday,
    blockedIps,
    activeAdmins,
    suspiciousRegistrations,
    passwordResetRequests,
    apiAttacks,
    securityWarnings,
    topAttackCountries,
  };
}

export async function listSuspiciousUsers(input?: {
  page?: number;
  pageSize?: number;
}) {
  const page = Math.max(1, input?.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, input?.pageSize ?? 25));

  const [items, total] = await Promise.all([
    prisma.suspiciousUserFlag.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        user: { select: { id: true, email: true, systemRole: true, accountStatus: true } },
      },
    }),
    prisma.suspiciousUserFlag.count({ where: { isActive: true } }),
  ]);

  return { items, total };
}

export async function flagSuspiciousUser(input: {
  userId: string;
  reason: string;
  riskLevel?: "low" | "medium" | "high" | "critical";
  notes?: string;
}): Promise<void> {
  await prisma.suspiciousUserFlag.create({
    data: {
      userId: input.userId,
      reason: input.reason,
      riskLevel: input.riskLevel ?? "medium",
      notes: input.notes,
    },
  });
}

export async function getSecuritySystemStatus() {
  const [
    settings,
    eventsLast24h,
    activeBlocks,
    activeSessions,
    totpEnabledCount,
    suspiciousUsers,
  ] = await Promise.all([
    prisma.securitySettings.findUnique({ where: { id: "default" } }),
    prisma.securityEvent.count({
      where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60_000) } },
    }),
    countActiveBlockedIps(),
    prisma.userSession.count({ where: { revokedAt: null } }),
    prisma.userTotp.count({ where: { isEnabled: true } }),
    prisma.suspiciousUserFlag.count({ where: { isActive: true } }),
  ]);

  return {
    settingsPresent: Boolean(settings),
    eventsLast24h,
    activeBlocks,
    activeSessions,
    totpEnabledCount,
    suspiciousUsers,
    cloudflareReady: true,
    headersEnabled: true,
    webhookSignatureCheck: true,
    prismaParameterized: true,
  };
}
