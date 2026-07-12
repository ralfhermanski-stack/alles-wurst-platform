/**
 * @file accounting-service.ts
 * @purpose Buchhaltungs-Operationen mit Audit-Log.
 */

import type { Membership, MembershipRole, PaymentStatus } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { findUserById } from "@/lib/users/user-service";
import {
  userFailure,
  userSuccess,
  type UserServiceResult,
} from "@/lib/users/user-errors";
import {
  MEMBERSHIP_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
} from "@/lib/users/membership-labels";
import { MEMBERSHIP_ROLE_LABELS } from "@/lib/membership/membership-labels";

import { isAdminActor } from "./accounting-auth";
import {
  AUDIT_ACTION_LABELS,
  createMembershipAuditLog,
  listMembershipAuditLogs,
} from "./accounting-audit";
import {
  getAccountingPositionTotals,
  listAccountingPositions,
} from "./accounting-position-service";
import type {
  AccountingPositionEntry,
  AccountingPositionTotals,
} from "./accounting-position-types";
import type {
  AccountingActor,
  AccountingAuditEntry,
  AccountingMembershipAction,
  AccountingSearchResult,
  AccountingUserDetail,
} from "./accounting-types";
import {
  formatUserDisplayName,
  toMembershipSnapshot,
} from "./accounting-types";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function parseDateInput(value: string | null | undefined): Date | null {
  if (!value?.trim()) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

async function getMembershipOrFail(
  userId: string,
): Promise<UserServiceResult<Membership>> {
  const membership = await prisma.membership.findUnique({
    where: { userId },
  });

  if (!membership) {
    return userFailure({
      code: "NOT_FOUND",
      message: "Mitgliedschaft wurde nicht gefunden.",
    });
  }

  return userSuccess(membership);
}

async function applyMembershipUpdate(
  actor: AccountingActor,
  targetUserId: string,
  action: AccountingMembershipAction,
  updateData: Partial<Membership>,
  auditAction: Parameters<typeof createMembershipAuditLog>[0]["action"],
  summary: string,
): Promise<UserServiceResult<Membership>> {
  const existingResult = await getMembershipOrFail(targetUserId);

  if (!existingResult.success) {
    return existingResult;
  }

  const previous = existingResult.data;
  const previousSnapshot = toMembershipSnapshot(previous);

  const membership = await prisma.membership.update({
    where: { userId: targetUserId },
    data: updateData,
  });

  await createMembershipAuditLog({
    targetUserId,
    actorUserId: actor.userId,
    actorRole: actor.role,
    action: auditAction,
    summary,
    previousValues: previousSnapshot,
    newValues: toMembershipSnapshot(membership),
    note: "note" in action ? action.note : undefined,
  });

  return userSuccess(membership);
}

/**
 * Sucht Nutzer nach Name, E-Mail oder User-ID.
 */
export async function searchAccountingUsers(
  query: string,
  limit = 25,
): Promise<UserServiceResult<AccountingSearchResult[]>> {
  const trimmed = query.trim();

  if (trimmed.length < 2) {
    return userFailure({
      code: "VALIDATION_ERROR",
      message: "Suchbegriff muss mindestens 2 Zeichen haben.",
    });
  }

  try {
    const whereClause = UUID_PATTERN.test(trimmed)
      ? {
          deletedAt: null,
          id: trimmed,
        }
      : {
          deletedAt: null,
          OR: [
            { email: { contains: trimmed, mode: "insensitive" as const } },
            {
              profile: {
                firstName: { contains: trimmed, mode: "insensitive" as const },
              },
            },
            {
              profile: {
                lastName: { contains: trimmed, mode: "insensitive" as const },
              },
            },
          ],
        };

    const users = await prisma.user.findMany({
      where: whereClause,
      include: { profile: true, membership: true },
      take: limit,
      orderBy: { createdAt: "desc" },
    });

    const results: AccountingSearchResult[] = users.map((user) => ({
      id: user.id,
      email: user.email,
      displayName: formatUserDisplayName(user),
      role: user.membership?.role ?? "registered",
      membershipStatus: user.membership?.status ?? "none",
      paymentStatus: user.membership?.paymentStatus ?? "none",
      accessBlocked: user.membership?.accessBlocked ?? false,
    }));

    return userSuccess(results);
  } catch {
    return userFailure({
      code: "INTERNAL_ERROR",
      message: "Nutzer-Suche ist fehlgeschlagen.",
    });
  }
}

/**
 * Lädt Nutzerdetails inkl. Profil, Mitgliedschaft und Audit-Verlauf.
 */
export async function getAccountingUserDetail(
  userId: string,
): Promise<
  UserServiceResult<{
    user: AccountingUserDetail;
    positions: AccountingPositionEntry[];
    positionTotals: AccountingPositionTotals;
    auditLog: AccountingAuditEntry[];
  }>
> {
  const userResult = await findUserById(userId);

  if (!userResult.success) {
    return userResult;
  }

  if (!userResult.data) {
    return userFailure({
      code: "NOT_FOUND",
      message: "Nutzer wurde nicht gefunden.",
    });
  }

  const user = userResult.data;
  const logs = await listMembershipAuditLogs(userId);
  const positionsResult = await listAccountingPositions(userId);
  const totalsResult = await getAccountingPositionTotals(userId);

  if (!positionsResult.success) {
    return positionsResult;
  }

  if (!totalsResult.success) {
    return totalsResult;
  }

  const auditLog: AccountingAuditEntry[] = logs.map((entry) => ({
    id: entry.id,
    action: entry.action,
    summary: entry.summary,
    actorUserId: entry.actorUserId,
    actorRole: entry.actorRole,
    previousValues:
      entry.previousValues &&
      typeof entry.previousValues === "object" &&
      !Array.isArray(entry.previousValues)
        ? (entry.previousValues as Record<string, unknown>)
        : null,
    newValues:
      entry.newValues &&
      typeof entry.newValues === "object" &&
      !Array.isArray(entry.newValues)
        ? (entry.newValues as Record<string, unknown>)
        : null,
    note: entry.note,
    createdAt: entry.createdAt.toISOString(),
  }));

  return userSuccess({
    user: {
      id: user.id,
      email: user.email,
      emailVerifiedAt: user.emailVerifiedAt?.toISOString() ?? null,
      createdAt: user.createdAt.toISOString(),
      profile: user.profile,
      membership: user.membership,
    },
    positions: positionsResult.data,
    positionTotals: totalsResult.data,
    auditLog,
  });
}

/**
 * Führt eine Buchhaltungsaktion an einer Mitgliedschaft aus.
 */
export async function executeAccountingMembershipAction(
  actor: AccountingActor,
  targetUserId: string,
  action: AccountingMembershipAction,
): Promise<UserServiceResult<Membership>> {
  switch (action.type) {
    case "pause":
      return applyMembershipUpdate(
        actor,
        targetUserId,
        action,
        { status: "paused" },
        "membership_pause",
        AUDIT_ACTION_LABELS.membership_pause,
      );

    case "reactivate": {
      const extendedUntil = parseDateInput(action.extendedUntil);

      return applyMembershipUpdate(
        actor,
        targetUserId,
        action,
        {
          status: "active",
          accessBlocked: false,
          blockReason: null,
          extendedUntil: extendedUntil ?? undefined,
        },
        "membership_reactivate",
        AUDIT_ACTION_LABELS.membership_reactivate,
      );
    }

    case "extend": {
      const extendedUntil = parseDateInput(action.extendedUntil);

      if (!extendedUntil) {
        return userFailure({
          code: "VALIDATION_ERROR",
          message: "Bitte ein gültiges Verlängerungsdatum angeben.",
        });
      }

      return applyMembershipUpdate(
        actor,
        targetUserId,
        action,
        {
          status: "active",
          extendedUntil,
        },
        "membership_extend",
        `${AUDIT_ACTION_LABELS.membership_extend} bis ${extendedUntil.toLocaleDateString("de-DE")}`,
      );
    }

    case "end":
      return applyMembershipUpdate(
        actor,
        targetUserId,
        action,
        {
          status: "cancelled",
          endsAt: new Date(),
          blockReason: action.blockReason ?? undefined,
        },
        "membership_end",
        AUDIT_ACTION_LABELS.membership_end,
      );

    case "block":
      return applyMembershipUpdate(
        actor,
        targetUserId,
        action,
        {
          status: "blocked",
          accessBlocked: true,
          blockReason: action.blockReason,
        },
        "membership_block",
        `${AUDIT_ACTION_LABELS.membership_block}: ${action.blockReason}`,
      );

    case "unlock":
      return applyMembershipUpdate(
        actor,
        targetUserId,
        action,
        {
          status: "active",
          accessBlocked: false,
          blockReason: null,
        },
        "membership_unlock",
        AUDIT_ACTION_LABELS.membership_unlock,
      );

    case "set_payment_status":
      return applyMembershipUpdate(
        actor,
        targetUserId,
        action,
        { paymentStatus: action.paymentStatus },
        "payment_status_change",
        `${AUDIT_ACTION_LABELS.payment_status_change}: ${PAYMENT_STATUS_LABELS[action.paymentStatus]}`,
      );

    case "set_payment_note":
      return applyMembershipUpdate(
        actor,
        targetUserId,
        action,
        { paymentNote: action.paymentNote },
        "payment_note",
        AUDIT_ACTION_LABELS.payment_note,
      );

    case "set_accounting_note":
      return applyMembershipUpdate(
        actor,
        targetUserId,
        action,
        { accountingNote: action.accountingNote },
        "accounting_note",
        AUDIT_ACTION_LABELS.accounting_note,
      );

    case "set_role": {
      if (!isAdminActor(actor) && action.role === "admin") {
        return userFailure({
          code: "FORBIDDEN",
          message: "Nur Administratoren dürfen die Admin-Rolle vergeben.",
        });
      }

      const membershipResult = await applyMembershipUpdate(
        actor,
        targetUserId,
        action,
        { role: action.role },
        "role_change",
        `${AUDIT_ACTION_LABELS.role_change}: ${MEMBERSHIP_ROLE_LABELS[action.role]}`,
      );

      if (!membershipResult.success) {
        return membershipResult;
      }

      if (action.role === "admin") {
        await prisma.user.update({
          where: { id: targetUserId },
          data: { systemRole: "ADMIN" },
        });
      }

      return membershipResult;
    }

    default: {
      const _exhaustive: never = action;
      return userFailure({
        code: "VALIDATION_ERROR",
        message: `Unbekannte Aktion: ${String(_exhaustive)}`,
      });
    }
  }
}

/**
 * Setzt Zahlungsstatus direkt (Hilfsfunktion für UI).
 */
export async function setAccountingPaymentStatus(
  actor: AccountingActor,
  targetUserId: string,
  paymentStatus: PaymentStatus,
  note?: string | null,
): Promise<UserServiceResult<Membership>> {
  return executeAccountingMembershipAction(actor, targetUserId, {
    type: "set_payment_status",
    paymentStatus,
    note,
  });
}

/**
 * Ändert Mitgliedschaftsrolle (z. B. nach manueller Zahlungszuordnung).
 */
export async function setAccountingMembershipRole(
  actor: AccountingActor,
  targetUserId: string,
  role: MembershipRole,
  note?: string | null,
): Promise<UserServiceResult<Membership>> {
  return executeAccountingMembershipAction(actor, targetUserId, {
    type: "set_role",
    role,
    note,
  });
}

export { MEMBERSHIP_STATUS_LABELS, PAYMENT_STATUS_LABELS };
