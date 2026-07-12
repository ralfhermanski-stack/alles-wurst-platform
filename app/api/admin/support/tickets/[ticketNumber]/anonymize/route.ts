import {
  assertStaffAccessFromRequest,
  staffGuardResponse,
} from "@/lib/admin/staff-api-utils";
import { jsonFromAuthResult } from "@/lib/auth/auth-api-utils";
import { hasAdminPermission } from "@/lib/admin/admin-permissions";
import { anonymizeSupportTicket } from "@/lib/support/support-ticket-service";
import { userFailure } from "@/lib/users/user-errors";

type RouteContext = { params: Promise<{ ticketNumber: string }> };

export async function POST(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const denied = await staffGuardResponse(request);

  if (denied) {
    return denied;
  }

  const access = await assertStaffAccessFromRequest(request);

  if (!access.success) {
    return jsonFromAuthResult(access);
  }

  if (!hasAdminPermission(access.data.systemRole, "tickets.admin")) {
    return jsonFromAuthResult(
      userFailure({
        code: "FORBIDDEN",
        message: "Nur Administratoren dürfen Tickets anonymisieren.",
      }),
    );
  }

  const { ticketNumber } = await context.params;
  const result = await anonymizeSupportTicket(
    access.data.userId,
    ticketNumber,
  );

  return jsonFromAuthResult(result);
}
