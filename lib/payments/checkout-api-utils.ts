/**
 * @file checkout-api-utils.ts
 * @purpose Hilfsfunktionen für Checkout-API-Routen.
 */

import {
  userErrorToStatus,
  type UserServiceResult,
} from "@/lib/users/user-errors";

export function jsonCheckoutSuccess<T>(data: T, status = 200): Response {
  return Response.json({ success: true, data }, { status });
}

export function jsonFromCheckoutResult<T>(
  result: UserServiceResult<T>,
): Response {
  if (result.success) {
    return jsonCheckoutSuccess(result.data);
  }

  return Response.json(
    { success: false, error: result.error },
    { status: userErrorToStatus(result.error.code) },
  );
}

export {
  parseJsonBody,
  getStringField,
} from "@/lib/tools/recipe-api-utils";
