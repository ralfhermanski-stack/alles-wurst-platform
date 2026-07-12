/**
 * @file admin-session.ts
 * @deprecated Token-basierter Adminmodus — durch Session-Auth ersetzt.
 */

/** @deprecated */
export function getAdminToken(): string | null {
  return null;
}

/** @deprecated */
export function setAdminToken(_token: string): void {}

/** @deprecated */
export function clearAdminToken(): void {}

/** @deprecated */
export function hasAdminToken(): boolean {
  return false;
}
