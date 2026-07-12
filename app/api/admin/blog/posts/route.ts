import {
  assertBlogAccessFromRequest,
  blogGuardResponse,
  jsonBlogError,
  jsonBlogSuccess,
  parseBlogJsonBody,
} from "@/lib/blog/blog-api-utils";
import {
  createBlogPost,
  listAdminBlogPosts,
} from "@/lib/blog/blog-admin-service";
import type { BlogAdminListFilters } from "@/lib/blog/blog-types";
import { jsonFromAuthResult } from "@/lib/auth/auth-api-utils";

export async function GET(request: Request): Promise<Response> {
  const denied = await blogGuardResponse(request);

  if (denied) {
    return denied;
  }

  const { searchParams } = new URL(request.url);

  const filters: BlogAdminListFilters = {
    status: (searchParams.get("status") ?? "all") as BlogAdminListFilters["status"],
    categoryId: searchParams.get("categoryId") ?? undefined,
    topicId: searchParams.get("topicId") ?? undefined,
    tagId: searchParams.get("tagId") ?? undefined,
    query: searchParams.get("query") ?? undefined,
    staleOnly: searchParams.get("staleOnly") === "1",
  };

  const posts = await listAdminBlogPosts(filters);
  return jsonBlogSuccess(posts);
}

export async function POST(request: Request): Promise<Response> {
  const denied = await blogGuardResponse(request);

  if (denied) {
    return denied;
  }

  const access = await assertBlogAccessFromRequest(request);

  if (!access.success) {
    return jsonFromAuthResult(access);
  }

  const bodyResult = await parseBlogJsonBody<{
    title?: string;
    slug?: string;
    excerpt?: string | null;
    summary?: string | null;
    body?: string;
    categoryId?: string | null;
    focusKeyword?: string | null;
    tagIds?: string[];
    topicIds?: string[];
    primaryTopicId?: string | null;
  }>(request);

  if (!bodyResult.success) {
    return bodyResult.response;
  }

  try {
    const post = await createBlogPost(access.data.userId, {
      title: bodyResult.data.title ?? "",
      slug: bodyResult.data.slug,
      excerpt: bodyResult.data.excerpt,
      summary: bodyResult.data.summary,
      body: bodyResult.data.body,
      categoryId: bodyResult.data.categoryId,
      focusKeyword: bodyResult.data.focusKeyword,
      tagIds: bodyResult.data.tagIds,
      topicIds: bodyResult.data.topicIds,
      primaryTopicId: bodyResult.data.primaryTopicId,
    });

    return jsonBlogSuccess(post);
  } catch (error) {
    return jsonBlogError(error instanceof Error ? error.message : "Fehler beim Anlegen.");
  }
}
