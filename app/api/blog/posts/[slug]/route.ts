import { jsonFromAuthResult } from "@/lib/auth/auth-api-utils";
import { getPublicBlogPostBySlug } from "@/lib/blog/blog-service";

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(
  _request: Request,
  context: RouteContext,
): Promise<Response> {
  const { slug } = await context.params;
  const post = await getPublicBlogPostBySlug(slug);

  if (!post) {
    return jsonFromAuthResult({
      success: false,
      error: { code: "NOT_FOUND", message: "Artikel nicht gefunden." },
    });
  }

  return jsonFromAuthResult({ success: true, data: post });
}
