/**
 * @file accounting-api-utils.ts
 * @purpose Hilfsfunktionen für Buchhaltungs-API-Routen.
 */

import {
  userErrorToStatus,
  type UserServiceResult,
} from "@/lib/users/user-errors";

export function jsonAccountingSuccess<T>(data: T, status = 200): Response {
  return Response.json({ success: true, data }, { status });
}

export function jsonFromAccountingResult<T>(
  result: UserServiceResult<T>,
): Response {
  if (result.success) {
    return jsonAccountingSuccess(result.data);
  }

  return Response.json(
    { success: false, error: result.error },
    { status: userErrorToStatus(result.error.code) },
  );
}

export {
  parseJsonBody,
  getStringField,
  getNullableStringField,
} from "@/lib/tools/recipe-api-utils";
