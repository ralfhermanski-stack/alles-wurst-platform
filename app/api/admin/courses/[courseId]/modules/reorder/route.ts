import { adminGuardResponse } from "@/lib/admin/admin-api-utils";
import { reorderCourseModules } from "@/lib/courses/admin-course-service";
import {
  jsonFromCourseResult,
  parseCourseJsonBody,
} from "@/lib/courses/course-api-utils";

type RouteContext = { params: Promise<{ courseId: string }> };

export async function PUT(
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

  const moduleIds = bodyResult.data.moduleIds;

  if (!Array.isArray(moduleIds)) {
    return jsonFromCourseResult({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Feld moduleIds (Array) ist erforderlich.",
      },
    });
  }

  const ids = moduleIds.filter((item): item is string => typeof item === "string");

  const result = await reorderCourseModules(courseId, ids);

  return jsonFromCourseResult(result);
}
