/**
 * @file security-audit-service.ts
 * @purpose Unveränderliches Administrator-Sicherheitsprotokoll.
 */

import type { Prisma } from "@prisma/client";
import type { SecurityAuditAction, SecurityAuditResult } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

export async function writeSecurityAuditLog(input: {
  action: SecurityAuditAction;
  result?: SecurityAuditResult;
  actorUserId?: string | null;
  targetUserId?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  ipAddress?: string | null;
  description?: string | null;
  metadata?: Record<string, unknown> | null;
}): Promise<void> {
  try {
    await prisma.securityAuditLog.create({
      data: {
        action: input.action,
        result: input.result ?? "success",
        actorUserId: input.actorUserId ?? null,
        targetUserId: input.targetUserId ?? null,
        entityType: input.entityType ?? null,
        entityId: input.entityId ?? null,
        ipAddress: input.ipAddress ?? null,
        description: input.description ?? null,
        metadata: input.metadata as Prisma.InputJsonValue | undefined,
      },
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[security-audit] Speichern fehlgeschlagen", error);
    }
  }
}

export async function listSecurityAuditLogs(input?: {
  page?: number;
  pageSize?: number;
  action?: SecurityAuditAction;
}) {
  const page = Math.max(1, input?.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, input?.pageSize ?? 25));
  const where = input?.action ? { action: input.action } : {};

  const [items, total] = await Promise.all([
    prisma.securityAuditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        actorUser: { select: { id: true, email: true, systemRole: true } },
        targetUser: { select: { id: true, email: true, systemRole: true } },
      },
    }),
    prisma.securityAuditLog.count({ where }),
  ]);

  return { items, total };
}
