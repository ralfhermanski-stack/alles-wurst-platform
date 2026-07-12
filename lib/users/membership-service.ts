/**
 * @file membership-service.ts
 * @purpose Service-Grundlage für Mitgliedschaft und Buchhaltungs-Korrekturen (Schritt 12).
 * @responsibility DB-Zugriff auf Membership — noch ohne API und Buchhaltungs-UI.
 */

import type { Membership } from "@prisma/client";

import type { MembershipAccessContext } from "@/lib/membership/membership-rules";
import { prisma } from "@/lib/db/prisma";

import {
  membershipRecordToAccessContext,
  resolveAppRoleFromMembership,
} from "./membership-mappers";
import {
  userFailure,
  userSuccess,
  type UserServiceResult,
} from "./user-errors";
import type { MembershipRecord, UpdateMembershipInput } from "./user-types";

/**
 * Lädt die Mitgliedschaft eines Nutzers.
 */
export async function getMembershipByUserId(
  userId: string,
): Promise<UserServiceResult<MembershipRecord | null>> {
  if (!userId.trim()) {
    return userFailure({
      code: "VALIDATION_ERROR",
      message: "Nutzer-ID ist erforderlich.",
    });
  }

  try {
    const membership = await prisma.membership.findUnique({
      where: { userId },
    });

    return userSuccess(membership);
  } catch {
    return userFailure({
      code: "INTERNAL_ERROR",
      message: "Mitgliedschaft konnte nicht geladen werden.",
    });
  }
}

/**
 * Löst den App-MembershipAccessContext aus der Datenbank auf.
 * Für spätere Session-Integration — ersetzt noch nicht den Header-Prototyp.
 */
export async function resolveMembershipAccessFromDb(
  userId: string,
): Promise<UserServiceResult<MembershipAccessContext>> {
  const result = await getMembershipByUserId(userId);

  if (!result.success) {
    return result;
  }

  return userSuccess(
    membershipRecordToAccessContext(userId, result.data),
  );
}

/**
 * Aktualisiert Mitgliedschaftsdaten (Buchhaltung — später).
 */
export async function updateMembership(
  userId: string,
  input: UpdateMembershipInput,
): Promise<UserServiceResult<MembershipRecord>> {
  if (!userId.trim()) {
    return userFailure({
      code: "VALIDATION_ERROR",
      message: "Nutzer-ID ist erforderlich.",
    });
  }

  try {
    const existing = await prisma.membership.findUnique({
      where: { userId },
    });

    if (!existing) {
      return userFailure({
        code: "NOT_FOUND",
        message: "Mitgliedschaft wurde nicht gefunden.",
      });
    }

    const membership = await prisma.membership.update({
      where: { userId },
      data: {
        role: input.role,
        status: input.status,
        paymentStatus: input.paymentStatus,
        paymentNote: input.paymentNote,
        accountingNote: input.accountingNote,
        accessBlocked: input.accessBlocked,
        blockReason: input.blockReason,
        startedAt: input.startedAt,
        endsAt: input.endsAt,
        extendedUntil: input.extendedUntil,
      },
    });

    return userSuccess(membership);
  } catch {
    return userFailure({
      code: "INTERNAL_ERROR",
      message: "Mitgliedschaft konnte nicht aktualisiert werden.",
    });
  }
}

/** Buchhaltung: Mitgliedschaft pausieren */
export async function pauseMembership(
  userId: string,
  options?: { accountingNote?: string | null; blockReason?: string | null },
): Promise<UserServiceResult<MembershipRecord>> {
  return updateMembership(userId, {
    status: "paused",
    accountingNote: options?.accountingNote,
    blockReason: options?.blockReason,
  });
}

/** Buchhaltung: Mitgliedschaft reaktivieren */
export async function reactivateMembership(
  userId: string,
  options?: { accountingNote?: string | null; extendedUntil?: Date | null },
): Promise<UserServiceResult<MembershipRecord>> {
  return updateMembership(userId, {
    status: "active",
    accessBlocked: false,
    blockReason: null,
    accountingNote: options?.accountingNote,
    extendedUntil: options?.extendedUntil,
  });
}

/** Buchhaltung: Mitgliedschaft verlängern */
export async function extendMembership(
  userId: string,
  extendedUntil: Date,
  options?: { accountingNote?: string | null },
): Promise<UserServiceResult<MembershipRecord>> {
  return updateMembership(userId, {
    status: "active",
    extendedUntil,
    accountingNote: options?.accountingNote,
  });
}

/** Buchhaltung: Mitgliedschaft beenden */
export async function endMembership(
  userId: string,
  options?: { accountingNote?: string | null; blockReason?: string | null },
): Promise<UserServiceResult<MembershipRecord>> {
  return updateMembership(userId, {
    status: "cancelled",
    endsAt: new Date(),
    accountingNote: options?.accountingNote,
    blockReason: options?.blockReason,
  });
}

/** Buchhaltung: Zahlungsnotiz hinterlegen */
export async function setPaymentNote(
  userId: string,
  paymentNote: string,
): Promise<UserServiceResult<MembershipRecord>> {
  return updateMembership(userId, { paymentNote });
}

/** Buchhaltung: Internen Vermerk speichern */
export async function setAccountingNote(
  userId: string,
  accountingNote: string,
): Promise<UserServiceResult<MembershipRecord>> {
  return updateMembership(userId, { accountingNote });
}

/** Buchhaltung: Rezept-/Club-Zugriff sperren */
export async function lockMembershipAccess(
  userId: string,
  blockReason: string,
  options?: { accountingNote?: string | null },
): Promise<UserServiceResult<MembershipRecord>> {
  return updateMembership(userId, {
    accessBlocked: true,
    blockReason,
    accountingNote: options?.accountingNote,
  });
}

/** Buchhaltung: Rezept-/Club-Zugriff freigeben */
export async function unlockMembershipAccess(
  userId: string,
  options?: { accountingNote?: string | null },
): Promise<UserServiceResult<MembershipRecord>> {
  return updateMembership(userId, {
    accessBlocked: false,
    blockReason: null,
    status: "active",
    accountingNote: options?.accountingNote,
  });
}

/**
 * Sucht Nutzer anhand von E-Mail oder Name (Buchhaltung — später).
 * Vorbereitet für accounting.user.search.
 */
export async function searchUsersForAccounting(
  query: string,
  limit = 20,
): Promise<UserServiceResult<UserSearchResult[]>> {
  const trimmed = query.trim();

  if (trimmed.length < 2) {
    return userFailure({
      code: "VALIDATION_ERROR",
      message: "Suchbegriff muss mindestens 2 Zeichen haben.",
    });
  }

  try {
    const users = await prisma.user.findMany({
      where: {
        deletedAt: null,
        OR: [
          { email: { contains: trimmed, mode: "insensitive" } },
          {
            profile: {
              firstName: { contains: trimmed, mode: "insensitive" },
            },
          },
          {
            profile: {
              lastName: { contains: trimmed, mode: "insensitive" },
            },
          },
        ],
      },
      include: {
        profile: true,
        membership: true,
      },
      take: limit,
      orderBy: { createdAt: "desc" },
    });

    const results: UserSearchResult[] = users.map((user) => ({
      id: user.id,
      email: user.email,
      displayName: formatDisplayName(user.profile),
      role: resolveAppRoleFromMembership(user.membership),
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

export type UserSearchResult = {
  id: string;
  email: string;
  displayName: string;
  role: ReturnType<typeof resolveAppRoleFromMembership>;
  membershipStatus: Membership["status"];
  paymentStatus: Membership["paymentStatus"];
  accessBlocked: boolean;
};

function formatDisplayName(
  profile: { firstName: string; lastName: string } | null,
): string {
  if (!profile) {
    return "—";
  }

  return `${profile.firstName} ${profile.lastName}`.trim();
}
