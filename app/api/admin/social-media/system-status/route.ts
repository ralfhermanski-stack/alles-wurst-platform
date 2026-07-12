import { adminGuardResponse } from "@/lib/admin/admin-api-utils";
import { jsonFromAuthResult } from "@/lib/auth/auth-api-utils";
import { getCombinedSystemStatus } from "@/lib/social-media/social-media-system-status";

export async function GET(request: Request): Promise<Response> {
  const denied = await adminGuardResponse(request);

  if (denied) {
    return denied;
  }

  const status = await getCombinedSystemStatus();

  return jsonFromAuthResult({ success: true, data: status });
}
