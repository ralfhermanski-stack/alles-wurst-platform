/**
 * @file platform-text-api-utils.ts
 */

import type { PlatformTextServiceResult } from "./platform-text-types";

export function jsonFromPlatformTextResult<T>(
  result: PlatformTextServiceResult<T>,
  successStatus = 200,
): Response {
  if (result.success) {
    return Response.json({ success: true, data: result.data }, { status: successStatus });
  }

  const status =
    result.error.code === "NOT_FOUND"
      ? 404
      : result.error.code === "VALIDATION_ERROR"
        ? 400
        : result.error.code === "FORBIDDEN"
          ? 403
          : 500;

  return Response.json({ success: false, error: result.error }, { status });
}
