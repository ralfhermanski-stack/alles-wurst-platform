/**
 * @file internal-api-url.ts
 * @purpose Interne Basis-URL für Middleware-Self-Fetches (ohne Hairpin/TLS-Probleme).
 */

import type { NextRequest } from "next/server";

/**
 * Löst eine API-URL für Server-interne Fetches aus der Middleware auf.
 * In Produktion über localhost, damit öffentliche HTTPS-Self-Calls nicht scheitern.
 */
export function resolveInternalApiUrl(
  apiPath: string,
  request: NextRequest,
): URL {
  const configured =
    process.env.INTERNAL_API_BASE_URL?.trim() ||
    process.env.MAINTENANCE_PROBE_URL?.trim();

  if (configured) {
    return new URL(apiPath, configured);
  }

  if (process.env.NODE_ENV !== "production") {
    return new URL(apiPath, request.url);
  }

  const port = process.env.PORT?.trim() || "3000";

  return new URL(apiPath, `http://127.0.0.1:${port}`);
}
