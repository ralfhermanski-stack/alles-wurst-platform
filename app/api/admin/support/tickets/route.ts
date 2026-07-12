import {
  assertStaffAccessFromRequest,
  staffGuardResponse,
} from "@/lib/admin/staff-api-utils";
import { jsonFromAuthResult } from "@/lib/auth/auth-api-utils";
import { listAdminSupportTickets } from "@/lib/support/support-ticket-service";
import { parseSupportTicketListFilters } from "@/lib/support/support-types";

export async function GET(request: Request): Promise<Response> {
  const denied = await staffGuardResponse(request);

  if (denied) {
    return denied;
  }

  const access = await assertStaffAccessFromRequest(request);

  if (!access.success) {
    return jsonFromAuthResult(access);
  }

  const { searchParams } = new URL(request.url);
  const filters = parseSupportTicketListFilters(searchParams);

  const tickets = await listAdminSupportTickets(
    access.data.systemRole,
    access.data.userId,
    filters,
  );

  return jsonFromAuthResult({ success: true, data: tickets });
}
