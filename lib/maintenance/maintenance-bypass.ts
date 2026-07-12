/**
 * @file maintenance-bypass.ts
 * @purpose Wer darf den Wartungsmodus umgehen?
 */

import type { SessionPayload } from "@/lib/auth/session-token";
import { isAdminSystemRole } from "@/lib/users/system-role";

export function canBypassMaintenance(session: SessionPayload | null): boolean {
  if (!session) {
    return false;
  }

  if (isAdminSystemRole(session.systemRole)) {
    return true;
  }

  return Boolean(session.maintenanceBypass);
}

export function isMaintenanceExemptPath(pathname: string): boolean {
  if (
    pathname.startsWith("/api")
    || pathname.startsWith("/_next")
    || pathname.startsWith("/wartung")
    || pathname.startsWith("/admin")
    || pathname === "/anmelden"
    || pathname === "/login"
    || pathname === "/registrieren"
    || pathname === "/favicon.ico"
    || pathname.startsWith("/images/")
  ) {
    return true;
  }

  return /\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$/i.test(pathname);
}
