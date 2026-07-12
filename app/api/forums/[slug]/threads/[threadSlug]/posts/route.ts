import { getSessionUserIdFromRequest } from "@/lib/auth/session";
import { jsonFromCourseResult, parseCourseJsonBody } from "@/lib/courses/course-api-utils";
import { createForumPost } from "@/lib/forums/forum-thread-service";
import { getStringField } from "@/lib/tools/recipe-api-utils";

type RouteContext = {
  params: Promise<{ slug: string; threadSlug: string }>;
};

export async function POST(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const userId = await getSessionUserIdFromRequest(request);

  if (!userId) {
    return jsonFromCourseResult({
      success: false,
      error: { code: "UNAUTHORIZED", message: "Anmeldung erforderlich." },
    });
  }

  const { slug, threadSlug } = await context.params;
  const bodyResult = await parseCourseJsonBody(request);

  if (!bodyResult.success) {
    return jsonFromCourseResult(bodyResult);
  }

  const body = getStringField(bodyResult.data, "body");

  if (!body) {
    return jsonFromCourseResult({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Beitrag darf nicht leer sein.",
      },
    });
  }

  const result = await createForumPost(slug, threadSlug, userId, { body });

  return jsonFromCourseResult(result);
}
