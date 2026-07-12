import { jsonFromAuthResult } from "@/lib/auth/auth-api-utils";
import { parseCourseJsonBody } from "@/lib/courses/course-api-utils";
import { rateSupportTicket } from "@/lib/support/support-ticket-service";
import { requireSupportUser } from "@/lib/support/support-api-utils";
import { getNullableStringField } from "@/lib/tools/recipe-api-utils";

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

  const rating =
    typeof bodyResult.data.rating === "number" ? bodyResult.data.rating : null;

  if (rating === null) {
    return jsonFromAuthResult({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Bewertung ist erforderlich.",
      },
    });
  }

  const result = await rateSupportTicket(
    auth.userId,
    ticketNumber,
    rating,
    getNullableStringField(bodyResult.data, "comment"),
  );

  return jsonFromAuthResult(result);
}
