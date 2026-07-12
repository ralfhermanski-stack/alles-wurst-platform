import { jsonFromAuthResult } from "@/lib/auth/auth-api-utils";
import { parseCourseJsonBody } from "@/lib/courses/course-api-utils";
import { addUserSupportReply } from "@/lib/support/support-ticket-service";
import { requireSupportUser } from "@/lib/support/support-api-utils";
import { getStringField } from "@/lib/tools/recipe-api-utils";

type RouteContext = { params: Promise<{ ticketNumber: string }> };

export async function POST(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const auth = await requireSupportUser(request);

  if (auth instanceof Response) {
    return auth;
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

  const result = await addUserSupportReply(auth.userId, ticketNumber, body);

  return jsonFromAuthResult(result);
}
