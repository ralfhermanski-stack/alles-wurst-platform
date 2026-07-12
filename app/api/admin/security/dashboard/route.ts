import { adminGuardResponse, jsonSuccess } from "@/lib/admin/admin-api-utils";
import { getAdminSecurityDashboard } from "@/lib/security/security-admin-service";

export async function GET(request: Request) {
  const guard = await adminGuardResponse(request);

  if (guard) {
    return guard;
  }

  const data = await getAdminSecurityDashboard();
  return jsonSuccess(data);
}
