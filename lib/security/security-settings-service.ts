/**
 * @file security-settings-service.ts
 * @purpose Globale Sicherheitseinstellungen (Singleton).
 */

import type { UserSystemRole } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

import { DEFAULT_TOTP_REQUIRED_ROLES } from "./security-types";

export async function getSecuritySettings() {
  let settings = await prisma.securitySettings.findUnique({
    where: { id: "default" },
  });

  if (!settings) {
    settings = await prisma.securitySettings.create({
      data: { id: "default" },
    });
  }

  return settings;
}

export async function updateSecuritySettings(
  data: Partial<{
    loginFailThresholdThrottle: number;
    loginFailThresholdCaptcha: number;
    loginFailThreshold30m: number;
    loginFailThreshold24h: number;
    loginRateLimitPerIp: number;
    registerRateLimitPerIp: number;
    passwordResetRateLimitPerIp: number;
    apiRateLimitPerIp: number;
    retentionLoginAttemptsDays: number;
    retentionSecurityEventsDays: number;
    retentionBlockedIpsDays: number;
    retentionAuditLogDays: number;
    totpRequiredRoles: UserSystemRole[];
  }>,
) {
  return prisma.securitySettings.update({
    where: { id: "default" },
    data: {
      ...data,
      totpRequiredRoles: data.totpRequiredRoles
        ? (data.totpRequiredRoles as unknown as object)
        : undefined,
    },
  });
}

export async function getTotpRequiredRoles(): Promise<UserSystemRole[]> {
  const settings = await getSecuritySettings();
  const raw = settings.totpRequiredRoles;

  if (Array.isArray(raw)) {
    return raw.filter((role): role is UserSystemRole => typeof role === "string");
  }

  return DEFAULT_TOTP_REQUIRED_ROLES;
}

export function isTotpRequiredForRole(
  role: UserSystemRole,
  requiredRoles: UserSystemRole[],
): boolean {
  return requiredRoles.includes(role);
}
