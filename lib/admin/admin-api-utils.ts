/**
 * @file admin-api-utils.ts
 * @purpose Hilfsfunktionen für Admin-API-Routen.
 */

import { jsonFromAuthResult } from "@/lib/auth/auth-api-utils";
import {
  jsonFromServiceResult,
  jsonSuccess,
  parseJsonBody,
  getStringField,
  getNullableStringField,
} from "@/lib/tools/recipe-api-utils";
import type { RecipeServiceResult } from "@/lib/tools/recipe-errors";

import { assertGranularAdminAccessFromRequest } from "@/lib/permissions/granular-admin-auth";

import { assertAdminAccessFromRequest } from "./admin-auth";

export {
  jsonSuccess,
  jsonFromServiceResult,
  parseJsonBody,
  getStringField,
  getNullableStringField,
};

/**
 * Prüft Admin-Zugriff und gibt bei Erfolg true zurück, sonst HTTP-Response.
 */
export async function requireAdmin(
  request: Request,
): Promise<RecipeServiceResult<true> | Response> {
  const access = await assertAdminAccessFromRequest(request);

  if (!access.success) {
    return jsonFromAuthResult(access);
  }

  return { success: true, data: true };
}

/**
 * Typisierte Guard-Hilfe: gibt Response bei Fehler, sonst null.
 */
export async function adminGuardResponse(
  request: Request,
): Promise<Response | null> {
  const access = await assertGranularAdminAccessFromRequest(request);

  if (!access.success) {
    return jsonFromAuthResult(access);
  }

  return null;
}

/** Legacy: nur Systemrolle ADMIN/SUPERADMIN */
export async function strictAdminGuardResponse(
  request: Request,
): Promise<Response | null> {
  const access = await assertAdminAccessFromRequest(request);

  if (!access.success) {
    return jsonFromAuthResult(access);
  }

  return null;
}
