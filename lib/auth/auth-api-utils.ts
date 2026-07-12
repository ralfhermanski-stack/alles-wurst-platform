/**
 * @file auth-api-utils.ts
 * @purpose Hilfsfunktionen für Auth-API-Routen.
 */

import {
  userErrorToStatus,
  type UserServiceResult,
} from "@/lib/users/user-errors";

export function jsonAuthSuccess<T>(data: T, status = 200): Response {
  return Response.json({ success: true, data }, { status });
}

export function jsonFromAuthResult<T>(result: UserServiceResult<T>): Response {
  if (result.success) {
    return jsonAuthSuccess(result.data);
  }

  return Response.json(
    { success: false, error: result.error },
    { status: userErrorToStatus(result.error.code) },
  );
}

export { parseJsonBody, getStringField, getNullableStringField } from "@/lib/tools/recipe-api-utils";
