import { adminGuardResponse } from "@/lib/admin/admin-api-utils";
import { jsonFromAuthResult } from "@/lib/auth/auth-api-utils";
import { listAdminMemberships } from "@/lib/admin/admin-membership-service";
import { userSuccess } from "@/lib/users/user-errors";

export async function GET(request: Request) {
  const denied = await adminGuardResponse(request);

  if (denied) {
    return denied;
  }

  const memberships = await listAdminMemberships();

  return jsonFromAuthResult(userSuccess(memberships));
}
