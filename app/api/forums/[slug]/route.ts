import { getSessionUserIdFromRequest } from "@/lib/auth/session";
import { jsonFromCourseResult } from "@/lib/courses/course-api-utils";
import {
  canReadForum,
  canWriteForum,
  forumNotFoundError,
  loadForumPermissionContext,
} from "@/lib/forums/forum-permissions";
import { getForumBySlug } from "@/lib/forums/forum-service";

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const { slug } = await context.params;
  const forum = await getForumBySlug(slug);

  if (!forum) {
    return jsonFromCourseResult({
      success: false,
      error: forumNotFoundError(),
    });
  }

  const userId = await getSessionUserIdFromRequest(request);
  const permissionContext = await loadForumPermissionContext(userId);
  const allowed = await canReadForum(userId, forum, permissionContext);

  if (!allowed) {
    return jsonFromCourseResult({
      success: false,
      error: forumNotFoundError(),
    });
  }

  const canWrite = await canWriteForum(userId, forum, permissionContext);

  return jsonFromCourseResult({
    success: true,
    data: {
      id: forum.id,
      title: forum.title,
      slug: forum.slug,
      description: forum.description,
      forumType: forum.forumType,
      courseTitle: forum.course?.title ?? null,
      courseSlug: forum.course?.slug ?? null,
      canWrite,
    },
  });
}
