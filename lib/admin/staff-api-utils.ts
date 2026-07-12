/**
 * @file staff-api-utils.ts
 * @purpose Guard für Support-Admin-APIs.
 */

import { jsonFromAuthResult } from "@/lib/auth/auth-api-utils";

import { assertStaffAccessFromRequest } from "./staff-auth";

export async function staffGuardResponse(
  request: Request,
): Promise<Response | null> {
  const access = await assertStaffAccessFromRequest(request);

  if (!access.success) {
    return jsonFromAuthResult(access);
  }

  return null;
}

export { assertStaffAccessFromRequest };
