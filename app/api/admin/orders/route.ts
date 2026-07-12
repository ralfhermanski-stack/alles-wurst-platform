import { adminGuardResponse } from "@/lib/admin/admin-api-utils";
import { jsonFromAuthResult } from "@/lib/auth/auth-api-utils";
import { listAdminOrders } from "@/lib/admin/admin-order-service";
import { userSuccess } from "@/lib/users/user-errors";

export async function GET(request: Request) {
  const denied = await adminGuardResponse(request);

  if (denied) {
    return denied;
  }

  const orders = await listAdminOrders();

  return jsonFromAuthResult(userSuccess(orders));
}
