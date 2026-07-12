import { adminGuardResponse } from "@/lib/admin/admin-api-utils";
import { regenerateCourseSalesProduct } from "@/lib/courses/admin-course-service";
import { jsonFromCourseResult } from "@/lib/courses/course-api-utils";

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
  const result = await regenerateCourseSalesProduct(courseId);

  return jsonFromCourseResult(result);
}
