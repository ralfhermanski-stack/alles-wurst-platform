import { jsonFromAuthResult } from "@/lib/auth/auth-api-utils";
import { getSessionUserIdFromRequest } from "@/lib/auth/session";
import { getPublishedKnowledgeBaseArticle } from "@/lib/knowledge-base/knowledge-base-service";
import { userFailure } from "@/lib/users/user-errors";

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const { slug } = await context.params;
  const userId = await getSessionUserIdFromRequest(request);
  const article = await getPublishedKnowledgeBaseArticle(slug, userId);

  if (!article) {
    return jsonFromAuthResult(
      userFailure({
        code: "NOT_FOUND",
        message: "Artikel nicht gefunden.",
      }),
    );
  }

  return jsonFromAuthResult({ success: true, data: article });
}
