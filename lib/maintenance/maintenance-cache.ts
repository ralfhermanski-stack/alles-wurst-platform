/**
 * @file maintenance-cache.ts
 * @purpose Kurzzeit-Cache für Wartungsstatus (Middleware + API).
 */

import type { MaintenanceHttpStatus } from "./maintenance-types";

type MaintenanceCacheEntry = {
  enabled: boolean;
  httpStatus: MaintenanceHttpStatus;
  checkedAt: number;
};

let cache: MaintenanceCacheEntry | null = null;

export const MAINTENANCE_CACHE_MS = 3000;

export function getMaintenanceCache(): MaintenanceCacheEntry | null {
  if (!cache) {
    return null;
  }

  if (Date.now() - cache.checkedAt > MAINTENANCE_CACHE_MS) {
    cache = null;
    return null;
  }

  return cache;
}

export function setMaintenanceCache(
  enabled: boolean,
  httpStatus: MaintenanceHttpStatus,
): void {
  cache = {
    enabled,
    httpStatus,
    checkedAt: Date.now(),
  };
}

export function invalidateMaintenanceCache(): void {
  cache = null;
}
