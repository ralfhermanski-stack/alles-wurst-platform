import { jsonFromAuthResult } from "@/lib/auth/auth-api-utils";
import {
  assertBlogAccessFromRequest,
  blogGuardResponse,
  jsonBlogError,
  jsonBlogSuccess,
  parseBlogJsonBody,
} from "@/lib/blog/blog-api-utils";
import { getAdminBlogPostDetail } from "@/lib/blog/blog-admin-service";
import { applyBlogSeoAnalysis } from "@/lib/blog/blog-seo-analyze-service";
import type { BlogSeoAnalysisResult } from "@/lib/blog/blog-types";

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
  const bodyResult = await parseBlogJsonBody<{ draft?: BlogSeoAnalysisResult }>(request);
  const draft = bodyResult.success ? bodyResult.data.draft : undefined;

  try {
    await applyBlogSeoAnalysis(
      postId,
      access.data.systemRole,
      access.data.userId,
      draft,
    );

    const post = await getAdminBlogPostDetail(postId);

    if (!post) {
      return jsonBlogError("Artikel nicht gefunden.", "NOT_FOUND");
    }

    return jsonBlogSuccess(post);
  } catch (error) {
    return jsonBlogError(
      error instanceof Error ? error.message : "SEO-Vorschläge konnten nicht übernommen werden.",
    );
  }
}
