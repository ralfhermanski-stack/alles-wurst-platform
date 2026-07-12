import { assertStaffAccessFromRequest } from "@/lib/admin/staff-auth";
import { jsonFromAuthResult } from "@/lib/auth/auth-api-utils";

/**
 * GET /api/admin/support/session — Prüft Staff-Session (ADMIN oder SUPPORT).
 */
export async function GET(request: Request) {
  const access = await assertStaffAccessFromRequest(request);

  if (!access.success) {
    return jsonFromAuthResult(access);
  }

  return jsonFromAuthResult({ success: true, data: access.data });
}
