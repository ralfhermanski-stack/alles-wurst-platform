import { adminGuardResponse } from "@/lib/admin/admin-api-utils";
import { jsonFromAuthResult } from "@/lib/auth/auth-api-utils";
import { listAdminWithdrawalRequests } from "@/lib/legal/legal-withdrawal-service";

export async function GET(request: Request): Promise<Response> {
  const denied = await adminGuardResponse(request);

  if (denied) {
    return denied;
  }

  const requests = await listAdminWithdrawalRequests();
  return jsonFromAuthResult({ success: true, data: requests });
}
