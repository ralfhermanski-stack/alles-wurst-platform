import { staffGuardResponse } from "@/lib/admin/staff-api-utils";
import { jsonFromAuthResult } from "@/lib/auth/auth-api-utils";
import { listSupportStaff } from "@/lib/support/support-ticket-service";

export async function GET(request: Request): Promise<Response> {
  const denied = await staffGuardResponse(request);

  if (denied) {
    return denied;
  }

  const staff = await listSupportStaff();

  return jsonFromAuthResult({ success: true, data: staff });
}
