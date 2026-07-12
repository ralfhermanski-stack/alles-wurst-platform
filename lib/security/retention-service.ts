/**
 * @file retention-service.ts
 * @purpose DSGVO-konforme Löschfristen für Sicherheitsdaten.
 */

import { prisma } from "@/lib/db/prisma";

import { getSecuritySettings } from "./security-settings-service";

export async function purgeExpiredSecurityData(): Promise<{
  eventsDeleted: number;
  blocksDeleted: number;
  loginAttemptsDeleted: number;
}> {
  const settings = await getSecuritySettings();
  const now = Date.now();

  const eventsCutoff = new Date(
    now - settings.retentionSecurityEventsDays * 24 * 60 * 60_000,
  );
  const loginCutoff = new Date(
    now - settings.retentionLoginAttemptsDays * 24 * 60 * 60_000,
  );
  const blocksCutoff = new Date(
    now - settings.retentionBlockedIpsDays * 24 * 60 * 60_000,
  );

  const [eventsDeleted, loginAttemptsDeleted, blocksDeleted] = await Promise.all([
    prisma.securityEvent.deleteMany({
      where: { createdAt: { lt: eventsCutoff } },
    }),
    prisma.securityEvent.deleteMany({
      where: {
        createdAt: { lt: loginCutoff },
        eventType: { in: ["LOGIN_FAILED", "ADMIN_LOGIN_FAILED", "TOTP_FAILED"] },
      },
    }),
    prisma.blockedIp.deleteMany({
      where: {
        isActive: false,
        revokedAt: { lt: blocksCutoff },
      },
    }),
  ]);

  return {
    eventsDeleted: eventsDeleted.count,
    loginAttemptsDeleted: loginAttemptsDeleted.count,
    blocksDeleted: blocksDeleted.count,
  };
}
