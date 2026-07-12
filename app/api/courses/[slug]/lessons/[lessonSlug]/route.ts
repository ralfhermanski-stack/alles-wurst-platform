import { getSessionUserIdFromRequest } from "@/lib/auth/session";
import { getLessonForUser } from "@/lib/courses/course-learning-service";
import { jsonFromCourseResult } from "@/lib/courses/course-api-utils";

type RouteContext = {
  params: Promise<{ slug: string; lessonSlug: string }>;
};

export async function GET(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const userId = await getSessionUserIdFromRequest(request);

  if (!userId) {
    return jsonFromCourseResult({
      success: false,
      error: { code: "FORBIDDEN", message: "Anmeldung erforderlich." },
    });
  }

  const { slug, lessonSlug } = await context.params;
  const result = await getLessonForUser(userId, slug, lessonSlug);

  return jsonFromCourseResult(result);
}
