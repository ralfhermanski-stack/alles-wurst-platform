/**
 * @file membership-mappers.ts
 * @purpose Abbildung zwischen Prisma-Mitgliedschaft und App-Membership-Kontext.
 */

import type { Membership } from "@prisma/client";

import {
  createMembershipContext,
  type MembershipAccessContext,
  type MembershipRole as AppMembershipRole,
} from "@/lib/membership/membership-rules";

import type { PrismaMembershipRole } from "./user-types";

/** Alle Prisma-Rollen, die in der App-Matrix verwendet werden */
const PRISMA_TO_APP_ROLE: Record<PrismaMembershipRole, AppMembershipRole> = {
  guest: "guest",
  registered: "registered",
  wurstclub: "wurstclub",
  meisterclub: "meisterclub",
  accounting: "accounting",
  admin: "admin",
};

/**
 * Prüft, ob ein String eine gültige Prisma-MembershipRole ist.
 */
export function isPrismaMembershipRole(
  value: string,
): value is PrismaMembershipRole {
  return value in PRISMA_TO_APP_ROLE;
}

/**
 * Mappt Prisma-Rolle auf App-Rolle (membership-rules).
 */
export function prismaRoleToAppRole(role: PrismaMembershipRole): AppMembershipRole {
  return PRISMA_TO_APP_ROLE[role];
}

/**
 * Ermittelt, ob der Zugriff aus DB-Datensatz gesperrt ist.
 */
export function isMembershipAccessBlockedFromRecord(
  membership: Membership | null,
): boolean {
  if (!membership) {
    return false;
  }

  return membership.accessBlocked || membership.status === "blocked";
}

/**
 * Leitet die effektive App-Rolle aus dem Mitgliedschaftsdatensatz ab.
 * `guest` in der DB ist unüblich — Fallback ist `registered`.
 */
export function resolveAppRoleFromMembership(
  membership: Membership | null,
): AppMembershipRole {
  if (!membership) {
    return "registered";
  }

  return prismaRoleToAppRole(membership.role);
}

/**
 * Erzeugt einen MembershipAccessContext aus DB-Daten (für spätere Auth).
 * Ersetzt noch nicht den localStorage-/Header-Prototyp.
 */
export function membershipRecordToAccessContext(
  userId: string,
  membership: Membership | null,
): MembershipAccessContext {
  return createMembershipContext(
    resolveAppRoleFromMembership(membership),
    userId,
    isMembershipAccessBlockedFromRecord(membership),
  );
}

/**
 * Prüft, ob eine Mitgliedschaft zeitlich noch gültig ist.
 */
export function isMembershipPeriodValid(membership: Membership): boolean {
  const now = new Date();
  const effectiveEnd = membership.extendedUntil ?? membership.endsAt;

  if (effectiveEnd && effectiveEnd < now) {
    return false;
  }

  return true;
}

/**
 * Prüft, ob Status und Zeitraum eine aktive Club-Mitgliedschaft erlauben.
 */
export function isMembershipEffectivelyActive(
  membership: Membership | null,
): boolean {
  if (!membership) {
    return false;
  }

  if (membership.status !== "active") {
    return false;
  }

  return isMembershipPeriodValid(membership);
}
