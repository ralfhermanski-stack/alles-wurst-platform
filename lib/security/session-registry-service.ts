/**
 * @file session-registry-service.ts
 * @purpose Aktive Sitzungen registrieren, prüfen und widerrufen.
 */

import { createHash } from "node:crypto";

import { prisma } from "@/lib/db/prisma";

import type { SecurityRequestContext } from "./security-types";
import { writeSecurityAuditLog } from "./security-audit-service";
import { parseUserAgent } from "./user-agent-parser";

export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function registerUserSession(input: {
  userId: string;
  sessionId: string;
  sessionToken: string;
  context: SecurityRequestContext;
}): Promise<{ sessionId: string; isNewDevice: boolean }> {
  const tokenHash = hashSessionToken(input.sessionToken);
  const parsed = parseUserAgent(input.context.userAgent);

  const existingDevice = await prisma.userSession.findFirst({
    where: {
      userId: input.userId,
      browser: parsed.browser,
      os: parsed.os,
      revokedAt: null,
    },
    orderBy: { createdAt: "desc" },
  });

  const isNewDevice = !existingDevice;

  await prisma.userSession.create({
    data: {
      id: input.sessionId,
      userId: input.userId,
      tokenHash,
      deviceLabel: parsed.deviceLabel,
      browser: parsed.browser,
      os: parsed.os,
      countryCode: input.context.countryCode,
      region: input.context.region,
      ipAddress: input.context.ipAddress,
      isNewDevice,
    },
  });

  return { sessionId: input.sessionId, isNewDevice };
}

export async function isSessionRevoked(sessionToken: string): Promise<boolean> {
  const tokenHash = hashSessionToken(sessionToken);
  const session = await prisma.userSession.findFirst({
    where: { tokenHash },
    select: { revokedAt: true },
  });

  if (!session) {
    return false;
  }

  return session.revokedAt !== null;
}

export async function touchUserSession(sessionToken: string): Promise<void> {
  const tokenHash = hashSessionToken(sessionToken);

  await prisma.userSession.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { lastActiveAt: new Date() },
  });
}

export async function listUserSessions(userId: string) {
  return prisma.userSession.findMany({
    where: { userId, revokedAt: null },
    orderBy: { lastActiveAt: "desc" },
  });
}

export async function revokeUserSession(
  userId: string,
  sessionId: string,
  actorUserId?: string,
  ipAddress?: string | null,
): Promise<void> {
  await prisma.userSession.updateMany({
    where: { id: sessionId, userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });

  await writeSecurityAuditLog({
    action: "SESSION_REVOKED",
    actorUserId: actorUserId ?? userId,
    targetUserId: userId,
    entityType: "UserSession",
    entityId: sessionId,
    ipAddress,
    description: "Sitzung beendet",
  });
}

export async function revokeAllUserSessions(
  userId: string,
  exceptSessionId?: string,
  actorUserId?: string,
  ipAddress?: string | null,
): Promise<number> {
  const result = await prisma.userSession.updateMany({
    where: {
      userId,
      revokedAt: null,
      ...(exceptSessionId ? { id: { not: exceptSessionId } } : {}),
    },
    data: { revokedAt: new Date() },
  });

  await writeSecurityAuditLog({
    action: "SESSION_REVOKED",
    actorUserId: actorUserId ?? userId,
    targetUserId: userId,
    ipAddress,
    description: "Alle Sitzungen beendet",
    metadata: { count: result.count },
  });

  return result.count;
}

export async function listAllActiveSessions(input?: {
  page?: number;
  pageSize?: number;
}) {
  const page = Math.max(1, input?.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, input?.pageSize ?? 25));

  const [items, total] = await Promise.all([
    prisma.userSession.findMany({
      where: { revokedAt: null },
      orderBy: { lastActiveAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        user: { select: { id: true, email: true, systemRole: true } },
      },
    }),
    prisma.userSession.count({ where: { revokedAt: null } }),
  ]);

  return { items, total };
}

export async function countActiveAdminSessions(): Promise<number> {
  return prisma.userSession.count({
    where: {
      revokedAt: null,
      user: {
        systemRole: { in: ["ADMIN", "SUPERADMIN"] },
        deletedAt: null,
        accountStatus: "active",
      },
    },
  });
}
