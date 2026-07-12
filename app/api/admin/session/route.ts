import { assertAdminAccessFromRequest } from "@/lib/admin/admin-auth";
import { jsonFromAuthResult } from "@/lib/auth/auth-api-utils";

/**
 * GET /api/admin/session — Prüft Admin-Session (User.systemRole = ADMIN).
 */
export async function GET(request: Request) {
  const access = await assertAdminAccessFromRequest(request);

  if (!access.success) {
    return jsonFromAuthResult(access);
  }

  return jsonFromAuthResult({ success: true, data: access.data });
}
