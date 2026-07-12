/**
 * @file membership-session.ts
 * @purpose Provisorische Mitgliedschaftsrolle im Browser (bis echte Auth).
 */

import {
  DEFAULT_MEMBERSHIP_ROLE,
  isMembershipRole,
  type MembershipRole,
} from "./membership-rules";

const ROLE_STORAGE_KEY = "alles-wurst-membership-role";
const ACCESS_BLOCKED_KEY = "alles-wurst-membership-access-blocked";

/** HTTP-Header für API-Aufrufe (Prototyp) */
export const MEMBERSHIP_ROLE_HEADER = "X-Alles-Wurst-Membership-Role";
export const MEMBERSHIP_ACCESS_BLOCKED_HEADER =
  "X-Alles-Wurst-Membership-Access-Blocked";

/**
 * Liest die gespeicherte Mitgliedschaftsrolle.
 */
export function getMembershipRole(): MembershipRole {
  if (typeof window === "undefined") {
    return DEFAULT_MEMBERSHIP_ROLE;
  }

  const stored = localStorage.getItem(ROLE_STORAGE_KEY);

  if (stored && isMembershipRole(stored)) {
    return stored;
  }

  return DEFAULT_MEMBERSHIP_ROLE;
}

/**
 * Speichert die Mitgliedschaftsrolle (Prototyp-Umschalter).
 */
export function setMembershipRole(role: MembershipRole): void {
  localStorage.setItem(ROLE_STORAGE_KEY, role);
}

/**
 * Manuell gesperrter Rezept-/Club-Zugriff (simuliert Buchhaltungs-Eingriff).
 */
export function isMembershipAccessBlocked(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return localStorage.getItem(ACCESS_BLOCKED_KEY) === "1";
}

/**
 * Setzt die Zugriffssperre (Prototyp).
 */
export function setMembershipAccessBlocked(blocked: boolean): void {
  if (blocked) {
    localStorage.setItem(ACCESS_BLOCKED_KEY, "1");
  } else {
    localStorage.removeItem(ACCESS_BLOCKED_KEY);
  }
}
