import { jsonFromAuthResult } from "@/lib/auth/auth-api-utils";
import { listPublicBlogPosts } from "@/lib/blog/blog-service";

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);

  const result = await listPublicBlogPosts({
    categorySlug: searchParams.get("category") ?? undefined,
    tagSlug: searchParams.get("tag") ?? undefined,
    topicSlug: searchParams.get("topic") ?? undefined,
    query: searchParams.get("q") ?? undefined,
    sort: (searchParams.get("sort") as "newest" | "popular") ?? "newest",
    limit: Number(searchParams.get("limit") ?? 12),
    offset: Number(searchParams.get("offset") ?? 0),
  });

  return jsonFromAuthResult({ success: true, data: result });
}
