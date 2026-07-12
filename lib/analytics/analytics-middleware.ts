/**
 * @file analytics-middleware.ts
 * @purpose Edge-kompatible Helfer für Middleware (kein node:crypto).
 */

export function shouldSkipAnalyticsPath(pathname: string): boolean {
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/images/") ||
    pathname === "/wartung"
  ) {
    return true;
  }

  return false;
}
