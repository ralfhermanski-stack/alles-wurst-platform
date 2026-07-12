import {
  assertBlogAccessFromRequest,
  blogGuardResponse,
  jsonBlogError,
  jsonBlogSuccess,
} from "@/lib/blog/blog-api-utils";
import { publishBlogPost } from "@/lib/blog/blog-admin-service";
import { jsonFromAuthResult } from "@/lib/auth/auth-api-utils";

type RouteContext = { params: Promise<{ postId: string }> };

export async function POST(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const denied = await blogGuardResponse(request);

  if (denied) {
    return denied;
  }

  const access = await assertBlogAccessFromRequest(request);

  if (!access.success) {
    return jsonFromAuthResult(access);
  }

  const { postId } = await context.params;

  try {
    const post = await publishBlogPost(postId, access.data.systemRole);
    return jsonBlogSuccess(post);
  } catch (error) {
    return jsonBlogError(error instanceof Error ? error.message : "Veröffentlichung fehlgeschlagen.");
  }
}
