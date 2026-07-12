import { adminGuardResponse } from "@/lib/admin/admin-api-utils";
import { revokeUserCourseAccess } from "@/lib/courses/course-access-service";
import { jsonFromCourseResult } from "@/lib/courses/course-api-utils";

type RouteContext = {
  params: Promise<{ userId: string; courseId: string }>;
};

export async function DELETE(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const denied = await adminGuardResponse(request);

  if (denied) {
    return denied;
  }

  const { userId, courseId } = await context.params;
  const result = await revokeUserCourseAccess(userId, courseId);

  return jsonFromCourseResult(result);
}
