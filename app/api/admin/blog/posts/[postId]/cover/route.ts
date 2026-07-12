import {
  assertBlogAccessFromRequest,
  blogGuardResponse,
  jsonBlogError,
  jsonBlogSuccess,
} from "@/lib/blog/blog-api-utils";
import {
  getAdminBlogPostDetail,
  updateBlogPost,
} from "@/lib/blog/blog-admin-service";
import {
  getBlogImageMaxBytes,
  isAllowedBlogImageMimeType,
  saveBlogCoverImage,
} from "@/lib/blog/blog-image-storage";
import { prisma } from "@/lib/db/prisma";
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
  const existing = await getAdminBlogPostDetail(postId);

  if (!existing) {
    return jsonBlogError("Artikel nicht gefunden.", "NOT_FOUND");
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return jsonBlogError("Keine Datei übermittelt.");
  }

  if (!isAllowedBlogImageMimeType(file.type)) {
    return jsonBlogError("Nur JPEG, PNG oder WebP sind erlaubt.");
  }

  if (file.size > getBlogImageMaxBytes()) {
    return jsonBlogError("Das Bild darf maximal 5 MB groß sein.");
  }

  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const saved = await saveBlogCoverImage(postId, file.name, file.type, bytes);

    const post = await updateBlogPost(
      postId,
      access.data.systemRole,
      access.data.userId,
      {
        coverAltText: existing.coverAltText ?? existing.title,
      },
    );

    await prisma.blogPost.update({
      where: { id: postId },
      data: {
        coverStorageKey: saved.storageKey,
        coverFileName: saved.fileName,
        coverMimeType: saved.mimeType,
      },
    });

    const refreshed = await getAdminBlogPostDetail(postId);
    return jsonBlogSuccess(refreshed ?? post);
  } catch (error) {
    return jsonBlogError(error instanceof Error ? error.message : "Upload fehlgeschlagen.");
  }
}
