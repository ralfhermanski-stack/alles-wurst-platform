/**
 * @file support-api-utils.ts
 * @purpose Auth-Guards für Support-Member-APIs.
 */

import { getSessionUserIdFromRequest } from "@/lib/auth/session";
import { jsonFromAuthResult } from "@/lib/auth/auth-api-utils";
import { userFailure } from "@/lib/users/user-errors";

export async function requireSupportUser(
  request: Request,
): Promise<{ userId: string } | Response> {
  const userId = await getSessionUserIdFromRequest(request);

  if (!userId) {
    return jsonFromAuthResult(
      userFailure({
        code: "UNAUTHORIZED",
        message: "Anmeldung erforderlich.",
      }),
    );
  }

  return { userId };
}
