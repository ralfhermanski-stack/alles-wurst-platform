import { adminGuardResponse } from "@/lib/admin/admin-api-utils";
import { reorderCourseLessons } from "@/lib/courses/admin-course-service";
import {
  jsonFromCourseResult,
  parseCourseJsonBody,
} from "@/lib/courses/course-api-utils";

type RouteContext = {
  params: Promise<{ courseId: string; moduleId: string }>;
};

export async function PUT(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const denied = await adminGuardResponse(request);

  if (denied) {
    return denied;
  }

  const { moduleId } = await context.params;
  const bodyResult = await parseCourseJsonBody(request);

  if (!bodyResult.success) {
    return jsonFromCourseResult(bodyResult);
  }

  const lessonIds = bodyResult.data.lessonIds;

  if (!Array.isArray(lessonIds)) {
    return jsonFromCourseResult({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Feld lessonIds (Array) ist erforderlich.",
      },
    });
  }

  const ids = lessonIds.filter((item): item is string => typeof item === "string");

  const result = await reorderCourseLessons(moduleId, ids);

  return jsonFromCourseResult(result);
}
