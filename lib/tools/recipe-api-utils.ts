/**
 * @file recipe-api-utils.ts
 * @purpose Hilfsfunktionen für API-Routen des Rezeptgenerators.
 * @responsibility JSON-Antworten, Request-Parsing, Service-Ergebnis → HTTP.
 * @usage Importiert von den API-Routen unter app/api/tools/recipes/.
 */

import {
  recipeErrorToStatus,
  type RecipeServiceResult,
} from "./recipe-errors";

/** Standard-JSON-Antwort bei Erfolg */
export function jsonSuccess<T>(data: T, status = 200): Response {
  return Response.json({ success: true, data }, { status });
}

/** Standard-JSON-Antwort bei Fehler */
export function jsonFromServiceResult<T>(
  result: RecipeServiceResult<T>,
): Response {
  if (result.success) {
    return jsonSuccess(result.data);
  }

  return Response.json(
    {
      success: false,
      error: result.error,
    },
    { status: recipeErrorToStatus(result.error.code) },
  );
}

/**
 * Liest und parst den JSON-Body eines Requests.
 *
 * @param request - Eingehender HTTP-Request
 */
export async function parseJsonBody<
  T extends Record<string, unknown> = Record<string, unknown>,
>(request: Request): Promise<T | null> {
  try {
    const body: unknown = await request.json();

    if (typeof body === "object" && body !== null && !Array.isArray(body)) {
      return body as T;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Liest userId aus Query-String oder JSON-Body.
 *
 * @param request    - HTTP-Request
 * @param body       - Bereits geparster Body (optional)
 * @param paramName  - Query-/Body-Feldname (Standard: userId)
 */
export function extractUserId(
  request: Request,
  body?: Record<string, unknown> | null,
  paramName = "userId",
): string | null {
  const fromQuery = new URL(request.url).searchParams.get(paramName);

  if (fromQuery) {
    return fromQuery;
  }

  if (body && typeof body[paramName] === "string") {
    return body[paramName];
  }

  return null;
}

/**
 * Liest einen String-Wert aus dem Body.
 *
 * @param body  - Request-Body
 * @param key   - Feldname
 */
export function getStringField(
  body: Record<string, unknown>,
  key: string,
): string | undefined {
  const value = body[key];

  return typeof value === "string" ? value : undefined;
}

/**
 * Liest einen optionalen String- oder Null-Wert aus dem Body.
 *
 * @param body  - Request-Body
 * @param key   - Feldname
 */
export function getNullableStringField(
  body: Record<string, unknown>,
  key: string,
): string | null | undefined {
  const value = body[key];

  if (value === null) {
    return null;
  }

  return typeof value === "string" ? value : undefined;
}
