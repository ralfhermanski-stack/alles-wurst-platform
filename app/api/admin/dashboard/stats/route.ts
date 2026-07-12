import { adminGuardResponse } from "@/lib/admin/admin-api-utils";
import { jsonFromAuthResult } from "@/lib/auth/auth-api-utils";
import { getAdminDashboardStats } from "@/lib/admin/admin-dashboard-service";
import { userSuccess } from "@/lib/users/user-errors";

export async function GET(request: Request) {
  const denied = await adminGuardResponse(request);

  if (denied) {
    return denied;
  }

  const stats = await getAdminDashboardStats();

  return jsonFromAuthResult(userSuccess(stats));
}
