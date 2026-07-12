import {
  assertStaffAccessFromRequest,
  staffGuardResponse,
} from "@/lib/admin/staff-api-utils";
import { jsonFromAuthResult } from "@/lib/auth/auth-api-utils";
import { parseCourseJsonBody } from "@/lib/courses/course-api-utils";
import { addStaffSupportReply } from "@/lib/support/support-ticket-service";
import { getStringField } from "@/lib/tools/recipe-api-utils";

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

  const { ticketNumber } = await context.params;
  const bodyResult = await parseCourseJsonBody(request);

  if (!bodyResult.success) {
    return jsonFromAuthResult(bodyResult);
  }

  const body = getStringField(bodyResult.data, "body");

  if (!body) {
    return jsonFromAuthResult({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Nachricht ist erforderlich.",
      },
    });
  }

  const result = await addStaffSupportReply(
    access.data.systemRole,
    access.data.userId,
    ticketNumber,
    body,
    { setWaitingUser: bodyResult.data.setWaitingUser === true },
  );

  return jsonFromAuthResult(result);
}
