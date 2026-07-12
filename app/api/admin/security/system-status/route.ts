import { adminGuardResponse, jsonSuccess } from "@/lib/admin/admin-api-utils";
import { getSecuritySystemStatus } from "@/lib/security/security-dashboard-service";

export async function GET(request: Request) {
  const guard = await adminGuardResponse(request);

  if (guard) {
    return guard;
  }

  const data = await getSecuritySystemStatus();
  return jsonSuccess(data);
}
