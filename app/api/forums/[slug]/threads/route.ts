import { getSessionUserIdFromRequest } from "@/lib/auth/session";
import { jsonFromCourseResult, parseCourseJsonBody } from "@/lib/courses/course-api-utils";
import {
  createForumThread,
  listForumThreads,
} from "@/lib/forums/forum-thread-service";
import { getStringField } from "@/lib/tools/recipe-api-utils";

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const { slug } = await context.params;
  const userId = await getSessionUserIdFromRequest(request);
  const result = await listForumThreads(slug, userId);

  return jsonFromCourseResult(result);
}

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

  const { slug } = await context.params;
  const bodyResult = await parseCourseJsonBody(request);

  if (!bodyResult.success) {
    return jsonFromCourseResult(bodyResult);
  }

  const body = bodyResult.data;
  const title = getStringField(body, "title");
  const content = getStringField(body, "body");

  if (!title || !content) {
    return jsonFromCourseResult({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Titel und Beitrag sind erforderlich.",
      },
    });
  }

  const result = await createForumThread(slug, userId, {
    title,
    body: content,
  });

  return jsonFromCourseResult(result);
}
