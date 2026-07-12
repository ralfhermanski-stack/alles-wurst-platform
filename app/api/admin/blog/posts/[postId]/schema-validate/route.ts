import {
  blogGuardResponse,
  jsonBlogError,
  jsonBlogSuccess,
} from "@/lib/blog/blog-api-utils";
import { validateBlogPostSchema } from "@/lib/blog/blog-seo-analyze-service";

type RouteContext = { params: Promise<{ postId: string }> };

export async function GET(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const denied = await blogGuardResponse(request);

  if (denied) {
    return denied;
  }

  const { postId } = await context.params;
  const result = await validateBlogPostSchema(postId);

  if (!result.valid && result.message === "Artikel nicht gefunden.") {
    return jsonBlogError(result.message, "NOT_FOUND");
  }

  return jsonBlogSuccess(result);
}
