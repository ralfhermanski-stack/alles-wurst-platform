import { adminGuardResponse } from "@/lib/admin/admin-api-utils";
import { getCourseValidationIssues } from "@/lib/courses/admin-course-service";
import { jsonFromCourseResult } from "@/lib/courses/course-api-utils";

type RouteContext = { params: Promise<{ courseId: string }> };

export async function GET(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const denied = await adminGuardResponse(request);

  if (denied) {
    return denied;
  }

  const { courseId } = await context.params;
  const result = await getCourseValidationIssues(courseId);

  return jsonFromCourseResult(result);
}
