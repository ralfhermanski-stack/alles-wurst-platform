import { adminGuardResponse } from "@/lib/admin/admin-api-utils";
import { jsonFromCourseResult, parseCourseJsonBody } from "@/lib/courses/course-api-utils";
import { reorderForum } from "@/lib/forums/forum-service";
import { getStringField } from "@/lib/tools/recipe-api-utils";

type RouteContext = { params: Promise<{ forumId: string }> };

export async function POST(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const denied = await adminGuardResponse(request);

  if (denied) {
    return denied;
  }

  const { forumId } = await context.params;
  const bodyResult = await parseCourseJsonBody(request);

  if (!bodyResult.success) {
    return jsonFromCourseResult(bodyResult);
  }

  const direction = getStringField(bodyResult.data, "direction");

  if (direction !== "up" && direction !== "down") {
    return jsonFromCourseResult({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Richtung muss „up“ oder „down“ sein.",
      },
    });
  }

  const result = await reorderForum(forumId, direction);

  return jsonFromCourseResult(result);
}
