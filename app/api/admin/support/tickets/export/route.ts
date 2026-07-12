import {
  assertStaffAccessFromRequest,
  staffGuardResponse,
} from "@/lib/admin/staff-api-utils";
import { exportSupportTicketsCsv } from "@/lib/support/support-ticket-service";
import { jsonFromAuthResult } from "@/lib/auth/auth-api-utils";
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

  const csv = await exportSupportTicketsCsv(
    access.data.systemRole,
    access.data.userId,
    filters,
  );

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="support-tickets.csv"',
    },
  });
}
