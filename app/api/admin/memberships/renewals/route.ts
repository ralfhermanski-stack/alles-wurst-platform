import { adminGuardResponse } from "@/lib/admin/admin-api-utils";
import { jsonFromAuthResult } from "@/lib/auth/auth-api-utils";
import {
  listMembershipRenewalOverview,
  listMembershipRenewalReminderLogs,
} from "@/lib/membership/membership-renewal-service";
import { userSuccess } from "@/lib/users/user-errors";

export async function GET(request: Request) {
  const denied = await adminGuardResponse(request);

  if (denied) {
    return denied;
  }

  const [overview, logs] = await Promise.all([
    listMembershipRenewalOverview(),
    listMembershipRenewalReminderLogs(150),
  ]);

  return jsonFromAuthResult(
    userSuccess({
      overview,
      logs,
    }),
  );
}
