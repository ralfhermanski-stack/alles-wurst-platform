/**
 * @file maintenance-probe-url.ts
 * @purpose Interne URL für Middleware-Abfrage des Wartungsstatus.
 *
 * In Produktion schlägt ein Fetch über die öffentliche HTTPS-URL oft fehl
 * (Hairpin-NAT, Zertifikatsprüfung). Daher localhost / konfigurierbare Basis.
 */

import type { NextRequest } from "next/server";

import { resolveInternalApiUrl } from "@/lib/http/internal-api-url";

export function resolveMaintenanceStatusProbeUrl(request: NextRequest): URL {
  return resolveInternalApiUrl("/api/maintenance/status", request);
}
