import { readBlogImageBytes } from "@/lib/blog/blog-image-storage";
import {
  getBlogPostCoverMeta,
  getBlogPostCoverMetaForAdmin,
} from "@/lib/blog/blog-service";

type RouteContext = { params: Promise<{ postId: string }> };

export async function GET(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const { postId } = await context.params;
  const { searchParams } = new URL(request.url);
  const preview = searchParams.get("preview");

  const meta =
    preview === postId
      ? await getBlogPostCoverMetaForAdmin(postId)
      : await getBlogPostCoverMeta(postId);

  if (!meta) {
    return new Response("Nicht gefunden", { status: 404 });
  }

  try {
    const bytes = await readBlogImageBytes(meta.storageKey);

    return new Response(Buffer.from(bytes), {
      headers: {
        "Content-Type": meta.mimeType,
        "Cache-Control":
          preview === postId
            ? "private, no-cache"
            : "public, max-age=86400, immutable",
      },
    });
  } catch {
    return new Response("Bild nicht gefunden", { status: 404 });
  }
}
