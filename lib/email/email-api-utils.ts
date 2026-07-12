/**
 * @file email-api-utils.ts
 */

import { jsonFromAuthResult } from "@/lib/auth/auth-api-utils";
import { assertAdminAccessFromRequest } from "@/lib/admin/admin-auth";
import { hasAdminPermission } from "@/lib/admin/admin-permissions";
import { hasEmailPermission, type EmailPermission } from "./email-permissions";

export async function emailGuardResponse(
  request: Request,
  permission: EmailPermission = "email.view",
): Promise<Response | null> {
  const access = await assertAdminAccessFromRequest(request);

  if (!access.success) {
    return jsonFromAuthResult(access);
  }

  if (
    !hasEmailPermission(access.data.systemRole, permission) &&
    !hasAdminPermission(access.data.systemRole, "settings.write")
  ) {
    return jsonFromAuthResult({
      success: false,
      error: {
        code: "FORBIDDEN",
        message: "Du hast keine Berechtigung für den E-Mail-Bereich.",
      },
    });
  }

  return null;
}
