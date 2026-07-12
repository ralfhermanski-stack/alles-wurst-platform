/**
 * @file totp-service.ts
 * @purpose TOTP-2FA Verwaltung (Setup, Verify, Backup-Codes).
 */

import type { UserSystemRole } from "@prisma/client";
import QRCode from "qrcode";

import { prisma } from "@/lib/db/prisma";

import { writeSecurityAuditLog } from "./security-audit-service";
import {
  getTotpRequiredRoles,
  isTotpRequiredForRole,
} from "./security-settings-service";
import {
  buildTotpUri,
  decryptTotpSecret,
  encryptTotpSecret,
  generateBackupCodes,
  generateTotpSecret,
  hashBackupCode,
  verifyBackupCodeHash,
  verifyTotpCode,
} from "./totp-crypto";

export async function isTotpEnabled(userId: string): Promise<boolean> {
  const record = await prisma.userTotp.findUnique({
    where: { userId },
    select: { isEnabled: true },
  });

  return Boolean(record?.isEnabled);
}

export async function isTotpRequiredForUser(
  userId: string,
  systemRole: UserSystemRole,
): Promise<boolean> {
  const requiredRoles = await getTotpRequiredRoles();
  return isTotpRequiredForRole(systemRole, requiredRoles) && !(await isTotpEnabled(userId));
}

export async function startTotpSetup(userId: string, email: string): Promise<{
  secret: string;
  qrCodeDataUrl: string;
  otpauthUri: string;
}> {
  const secret = generateTotpSecret();
  const encrypted = await encryptTotpSecret(secret);
  const otpauthUri = buildTotpUri({ secret, email, issuer: "Alles Wurst" });
  const qrCodeDataUrl = await QRCode.toDataURL(otpauthUri);

  await prisma.userTotp.upsert({
    where: { userId },
    create: {
      userId,
      secretEncrypted: encrypted,
      isEnabled: false,
    },
    update: {
      secretEncrypted: encrypted,
      isEnabled: false,
      enabledAt: null,
    },
  });

  return { secret, qrCodeDataUrl, otpauthUri };
}

export async function confirmTotpSetup(
  userId: string,
  code: string,
  actorIp?: string | null,
): Promise<{ backupCodes: string[] }> {
  const record = await prisma.userTotp.findUnique({ where: { userId } });

  if (!record) {
    throw new Error("TOTP-Setup nicht gestartet.");
  }

  const secret = await decryptTotpSecret(record.secretEncrypted);

  if (!verifyTotpCode(secret, code)) {
    throw new Error("Ungültiger Bestätigungscode.");
  }

  await prisma.totpBackupCode.deleteMany({ where: { userId } });

  const plainCodes = generateBackupCodes();
  await prisma.totpBackupCode.createMany({
    data: await Promise.all(
      plainCodes.map(async (backupCode) => ({
        userId,
        codeHash: await hashBackupCode(backupCode),
      })),
    ),
  });

  await prisma.userTotp.update({
    where: { userId },
    data: { isEnabled: true, enabledAt: new Date() },
  });

  await writeSecurityAuditLog({
    action: "TOTP_ENABLED",
    actorUserId: userId,
    targetUserId: userId,
    ipAddress: actorIp,
    description: "Zwei-Faktor-Authentifizierung aktiviert",
  });

  return { backupCodes: plainCodes };
}

export async function verifyUserTotp(
  userId: string,
  code: string,
): Promise<boolean> {
  const record = await prisma.userTotp.findUnique({ where: { userId } });

  if (!record?.isEnabled) {
    return true;
  }

  const secret = await decryptTotpSecret(record.secretEncrypted);

  if (verifyTotpCode(secret, code)) {
    await prisma.userTotp.update({
      where: { userId },
      data: { lastUsedAt: new Date() },
    });

    return true;
  }

  const backupCodes = await prisma.totpBackupCode.findMany({
    where: { userId, usedAt: null },
  });

  for (const backup of backupCodes) {
    if (await verifyBackupCodeHash(code, backup.codeHash)) {
      await prisma.totpBackupCode.update({
        where: { id: backup.id },
        data: { usedAt: new Date() },
      });

      return true;
    }
  }

  return false;
}

export async function disableTotp(
  userId: string,
  code: string,
  actorIp?: string | null,
): Promise<void> {
  const valid = await verifyUserTotp(userId, code);

  if (!valid) {
    throw new Error("Ungültiger Code.");
  }

  await prisma.userTotp.update({
    where: { userId },
    data: { isEnabled: false, enabledAt: null },
  });

  await prisma.totpBackupCode.deleteMany({ where: { userId } });

  await writeSecurityAuditLog({
    action: "TOTP_DISABLED",
    actorUserId: userId,
    targetUserId: userId,
    ipAddress: actorIp,
    description: "Zwei-Faktor-Authentifizierung deaktiviert",
  });
}

export async function getTotpStatus(userId: string) {
  const record = await prisma.userTotp.findUnique({
    where: { userId },
    select: { isEnabled: true, enabledAt: true, lastUsedAt: true },
  });

  const unusedBackupCodes = await prisma.totpBackupCode.count({
    where: { userId, usedAt: null },
  });

  return {
    isEnabled: Boolean(record?.isEnabled),
    enabledAt: record?.enabledAt ?? null,
    lastUsedAt: record?.lastUsedAt ?? null,
    unusedBackupCodes,
  };
}
