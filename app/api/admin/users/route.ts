import { adminGuardResponse } from "@/lib/admin/admin-api-utils";
import { jsonFromAuthResult } from "@/lib/auth/auth-api-utils";
import { listAdminUsers } from "@/lib/admin/admin-user-service";
import { userSuccess } from "@/lib/users/user-errors";

export async function GET(request: Request) {
  const denied = await adminGuardResponse(request);

  if (denied) {
    return denied;
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("q") ?? undefined;
  const users = await listAdminUsers(search);

  return jsonFromAuthResult(userSuccess(users));
}
