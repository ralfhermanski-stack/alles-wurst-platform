/**
 * @file account-status.ts
 * @purpose Kontostatus (active/suspended/deactivated) — getrennt von Mitgliedschaft.
 */

import type { UserAccountStatus } from "@prisma/client";

export type { UserAccountStatus };

export const USER_ACCOUNT_STATUS_LABELS: Record<UserAccountStatus, string> = {
  active: "Aktiv",
  suspended: "Gesperrt",
  deactivated: "Deaktiviert",
};

export function isLoginAllowed(
  accountStatus: UserAccountStatus | null | undefined,
  deletedAt: Date | null | undefined,
): boolean {
  if (deletedAt) {
    return false;
  }

  return accountStatus === "active" || accountStatus === undefined;
}

export function loginBlockedMessage(
  accountStatus: UserAccountStatus | null | undefined,
): string {
  if (accountStatus === "suspended") {
    return "Dein Konto wurde vorübergehend gesperrt. Bitte wende dich an den Support.";
  }

  return "Dein Konto wurde deaktiviert. Bitte wende dich an den Support.";
}
