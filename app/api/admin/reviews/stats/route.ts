import { adminGuardResponse } from "@/lib/admin/admin-api-utils";
import { createAdminAuditLog } from "@/lib/admin/admin-audit";
import { getSessionUserIdFromRequest } from "@/lib/auth/session";
import { jsonFromCourseResult } from "@/lib/courses/course-api-utils";
import { getPublicReviewStats } from "@/lib/reviews/public-review-service";

export async function GET(request: Request): Promise<Response> {
  const denied = await adminGuardResponse(request);

  if (denied) {
    return denied;
  }

  const stats = await getPublicReviewStats();

  return jsonFromCourseResult({ success: true, data: stats });
}
