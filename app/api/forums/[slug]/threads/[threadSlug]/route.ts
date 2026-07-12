import { getSessionUserIdFromRequest } from "@/lib/auth/session";
import { jsonFromCourseResult } from "@/lib/courses/course-api-utils";
import { getForumThreadDetail } from "@/lib/forums/forum-thread-service";

type RouteContext = {
  params: Promise<{ slug: string; threadSlug: string }>;
};

export async function GET(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const { slug, threadSlug } = await context.params;
  const userId = await getSessionUserIdFromRequest(request);
  const result = await getForumThreadDetail(slug, threadSlug, userId);

  return jsonFromCourseResult(result);
}
