import { jsonFromAuthResult } from "@/lib/auth/auth-api-utils";
import {
  assertBlogAccessFromRequest,
  blogGuardResponse,
  jsonBlogError,
  jsonBlogSuccess,
} from "@/lib/blog/blog-api-utils";
import { prisma } from "@/lib/db/prisma";
import { canWriteBlogPost } from "@/lib/blog/blog-permissions";
import { runBlogSeoAnalysis } from "@/lib/blog/blog-seo-analyze-service";

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

  const row = await prisma.blogPost.findUnique({
    where: { id: postId },
    select: { authorUserId: true },
  });

  if (!row) {
    return jsonBlogError("Artikel nicht gefunden.", "NOT_FOUND");
  }

  if (!canWriteBlogPost(access.data.systemRole, row.authorUserId, access.data.userId)) {
    return jsonBlogError("Keine Berechtigung.", "FORBIDDEN");
  }

  try {
    const result = await runBlogSeoAnalysis(postId);
    return jsonBlogSuccess(result);
  } catch (error) {
    return jsonBlogError(
      error instanceof Error ? error.message : "SEO-Analyse fehlgeschlagen.",
    );
  }
}
