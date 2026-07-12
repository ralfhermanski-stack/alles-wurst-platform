/**
 * @file course-api-utils.ts
 * @purpose Hilfsfunktionen für Kurs-API-Routen.
 */

import {
  userErrorToStatus,
  userFailure,
  userSuccess,
  type UserServiceResult,
} from "@/lib/users/user-errors";
import { parseJsonBody } from "@/lib/tools/recipe-api-utils";

export function jsonCourseSuccess<T>(data: T, status = 200): Response {
  return Response.json({ success: true, data }, { status });
}

export function jsonFromCourseResult<T>(
  result: UserServiceResult<T>,
  successStatus = 200,
): Response {
  if (result.success) {
    return jsonCourseSuccess(result.data, successStatus);
  }

  return Response.json(
    {
      success: false,
      error: result.error,
    },
    { status: userErrorToStatus(result.error.code) },
  );
}

export async function parseCourseJsonBody(
  request: Request,
): Promise<UserServiceResult<Record<string, unknown>>> {
  const body = await parseJsonBody(request);

  if (!body) {
    return userFailure({
      code: "VALIDATION_ERROR",
      message: "Ungültiger Request-Body.",
    });
  }

  return userSuccess(body);
}
