/**
 * @file maintenance-probe-url.ts
 * @purpose Interne URL für Middleware-Abfrage des Wartungsstatus.
 *
 * In Produktion schlägt ein Fetch über die öffentliche HTTPS-URL oft fehl
 * (Hairpin-NAT, Zertifikatsprüfung). Daher localhost / konfigurierbare Basis.
 */

import type { NextRequest } from "next/server";

export function resolveMaintenanceStatusProbeUrl(request: NextRequest): URL {
  const configured = process.env.MAINTENANCE_PROBE_URL?.trim();

  if (configured) {
    return new URL("/api/maintenance/status", configured);
  }

  if (process.env.NODE_ENV !== "production") {
    return new URL("/api/maintenance/status", request.url);
  }

  const port = process.env.PORT?.trim() || "3000";

  return new URL(`/api/maintenance/status`, `http://127.0.0.1:${port}`);
}
