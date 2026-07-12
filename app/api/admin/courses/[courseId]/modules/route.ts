import { adminGuardResponse } from "@/lib/admin/admin-api-utils";
import { createCourseModule } from "@/lib/courses/admin-course-service";
import { jsonFromCourseResult, parseCourseJsonBody } from "@/lib/courses/course-api-utils";
import {
  getNullableStringField,
  getStringField,
} from "@/lib/tools/recipe-api-utils";

type RouteContext = { params: Promise<{ courseId: string }> };

export async function POST(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const denied = await adminGuardResponse(request);

  if (denied) {
    return denied;
  }

  const { courseId } = await context.params;
  const bodyResult = await parseCourseJsonBody(request);

  if (!bodyResult.success) {
    return jsonFromCourseResult(bodyResult);
  }

  const body = bodyResult.data;
  const title = getStringField(body, "title");

  if (!title) {
    return jsonFromCourseResult({
      success: false,
      error: { code: "VALIDATION_ERROR", message: "Modultitel erforderlich." },
    });
  }

  const result = await createCourseModule(courseId, {
    title,
    description: getNullableStringField(body, "description"),
    sortOrder:
      typeof body.sortOrder === "number" ? body.sortOrder : undefined,
  });

  return jsonFromCourseResult(result);
}
