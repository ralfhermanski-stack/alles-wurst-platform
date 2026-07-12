import {
  assertBlogAccessFromRequest,
  blogGuardResponse,
  jsonBlogError,
  jsonBlogSuccess,
  parseBlogJsonBody,
} from "@/lib/blog/blog-api-utils";
import {
  deleteBlogPost,
  getAdminBlogPostDetail,
  updateBlogPost,
} from "@/lib/blog/blog-admin-service";
import type { UpdateBlogPostInput } from "@/lib/blog/blog-types";
import { jsonFromAuthResult } from "@/lib/auth/auth-api-utils";

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
  const post = await getAdminBlogPostDetail(postId);

  if (!post) {
    return jsonBlogError("Artikel nicht gefunden.", "NOT_FOUND");
  }

  return jsonBlogSuccess(post);
}

export async function PATCH(
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
  const bodyResult = await parseBlogJsonBody<UpdateBlogPostInput>(request);

  if (!bodyResult.success) {
    return bodyResult.response;
  }

  try {
    const post = await updateBlogPost(
      postId,
      access.data.systemRole,
      access.data.userId,
      bodyResult.data,
    );

    return jsonBlogSuccess(post);
  } catch (error) {
    return jsonBlogError(error instanceof Error ? error.message : "Fehler beim Speichern.");
  }
}

export async function DELETE(
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
    await deleteBlogPost(postId, access.data.systemRole, access.data.userId);
    return jsonBlogSuccess({ id: postId });
  } catch (error) {
    return jsonBlogError(error instanceof Error ? error.message : "Fehler beim Löschen.");
  }
}
