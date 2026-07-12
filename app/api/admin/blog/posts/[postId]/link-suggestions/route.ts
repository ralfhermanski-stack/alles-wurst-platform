import {
  blogGuardResponse,
  jsonBlogSuccess,
} from "@/lib/blog/blog-api-utils";
import { getBlogLinkSuggestions } from "@/lib/blog/blog-admin-service";

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
  const suggestions = await getBlogLinkSuggestions(postId);

  return jsonBlogSuccess(suggestions);
}
