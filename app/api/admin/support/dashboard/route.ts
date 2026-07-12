import { staffGuardResponse, assertStaffAccessFromRequest } from "@/lib/admin/staff-api-utils";
import { jsonFromAuthResult } from "@/lib/auth/auth-api-utils";
import { getSupportDashboardStats } from "@/lib/support/support-ticket-service";

export async function GET(request: Request): Promise<Response> {
  const denied = await staffGuardResponse(request);

  if (denied) {
    return denied;
  }

  const access = await assertStaffAccessFromRequest(request);

  if (!access.success) {
    return jsonFromAuthResult(access);
  }

  const stats = await getSupportDashboardStats(
    access.data.systemRole,
    access.data.userId,
  );

  return jsonFromAuthResult({ success: true, data: stats });
}
