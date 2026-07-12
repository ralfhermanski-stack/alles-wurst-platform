import { getSessionUserIdFromRequest } from "@/lib/auth/session";
import { jsonFromCourseResult } from "@/lib/courses/course-api-utils";
import { getCommunityOverview } from "@/lib/forums/forum-community-service";

export async function GET(request: Request): Promise<Response> {
  const userId = await getSessionUserIdFromRequest(request);
  const overview = await getCommunityOverview(userId);

  return jsonFromCourseResult({ success: true, data: overview });
}
