import { adminGuardResponse } from "@/lib/admin/admin-api-utils";
import { jsonFromAuthResult } from "@/lib/auth/auth-api-utils";
import { listAdminDataExports } from "@/lib/privacy/admin-privacy-service";

export async function GET(request: Request): Promise<Response> {
  const denied = await adminGuardResponse(request);

  if (denied) {
    return denied;
  }

  const rows = await listAdminDataExports();
  return jsonFromAuthResult({ success: true, data: rows });
}
