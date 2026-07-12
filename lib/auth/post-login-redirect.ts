/**
 * @file post-login-redirect.ts
 * @purpose Zielpfad nach erfolgreichem Login (Rolle + optionales returnTo).
 */

import type { UserSystemRole } from "@prisma/client";

import { isAdminSystemRole } from "@/lib/users/system-role";

function isSafeInternalPath(path: string): boolean {
  return path.startsWith("/") && !path.startsWith("//");
}

/**
 * Ermittelt den Redirect nach Login.
 * Admins landen zuverlässig im Adminbereich, normale Nutzer im Mitgliederbereich.
 */
export function resolvePostLoginPath(
  systemRole: UserSystemRole,
  returnTo: string | null | undefined,
): string {
  const fallback = isAdminSystemRole(systemRole) ? "/admin" : "/mein-bereich";

  if (!returnTo || !isSafeInternalPath(returnTo)) {
    return fallback;
  }

  if (isAdminSystemRole(systemRole)) {
    if (returnTo.startsWith("/admin")) {
      return returnTo;
    }

    return "/admin";
  }

  if (returnTo.startsWith("/admin")) {
    return "/mein-bereich";
  }

  return returnTo;
}
