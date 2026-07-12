import {
  assertStaffAccessFromRequest,
  staffGuardResponse,
} from "@/lib/admin/staff-api-utils";
import { jsonFromAuthResult } from "@/lib/auth/auth-api-utils";
import { parseCourseJsonBody } from "@/lib/courses/course-api-utils";
import {
  addInternalSupportNote,
  addStaffSupportReply,
  assignSupportTicket,
  getAdminSupportTicketDetail,
  updateSupportTicketAdmin,
} from "@/lib/support/support-ticket-service";
import { getNullableStringField, getStringField } from "@/lib/tools/recipe-api-utils";
import type { SupportTicketPriority, SupportTicketStatus } from "@prisma/client";

type RouteContext = { params: Promise<{ ticketNumber: string }> };

export async function GET(
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

  const { ticketNumber } = await context.params;
  const result = await getAdminSupportTicketDetail(
    access.data.systemRole,
    access.data.userId,
    ticketNumber,
  );

  return jsonFromAuthResult(result);
}

export async function PATCH(
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

  const { ticketNumber } = await context.params;
  const bodyResult = await parseCourseJsonBody(request);

  if (!bodyResult.success) {
    return jsonFromAuthResult(bodyResult);
  }

  const body = bodyResult.data;

  const result = await updateSupportTicketAdmin(
    access.data.systemRole,
    access.data.userId,
    ticketNumber,
    {
      status: getStringField(body, "status") as SupportTicketStatus | undefined,
      priority: getStringField(body, "priority") as
        | SupportTicketPriority
        | undefined,
      categoryId: getStringField(body, "categoryId") ?? undefined,
      closureNote: getNullableStringField(body, "closureNote"),
    },
  );

  return jsonFromAuthResult(result);
}
