import { adminGuardResponse } from "@/lib/admin/admin-api-utils";
import { jsonFromAuthResult } from "@/lib/auth/auth-api-utils";
import {
  deleteSocialPost,
  updateSocialPost,
} from "@/lib/social-media/social-media-admin-service";
import type { SocialMediaPostType } from "@prisma/client";

type RouteContext = {
  params: Promise<{ postId: string }>;
};

export async function PATCH(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const denied = await adminGuardResponse(request);

  if (denied) {
    return denied;
  }

  const { postId } = await context.params;
  const body = (await request.json()) as Record<string, unknown>;

  const result = await updateSocialPost(postId, {
    channelId: typeof body.channelId === "string" ? body.channelId : undefined,
    title:
      body.title === null
        ? null
        : typeof body.title === "string"
          ? body.title
          : undefined,
    content:
      body.content === null
        ? null
        : typeof body.content === "string"
          ? body.content
          : undefined,
    postType:
      typeof body.postType === "string"
        ? (body.postType as SocialMediaPostType)
        : undefined,
    thumbnailUrl:
      body.thumbnailUrl === null
        ? null
        : typeof body.thumbnailUrl === "string"
          ? body.thumbnailUrl
          : undefined,
    mediaUrl:
      body.mediaUrl === null
        ? null
        : typeof body.mediaUrl === "string"
          ? body.mediaUrl
          : undefined,
    permalink:
      body.permalink === null
        ? null
        : typeof body.permalink === "string"
          ? body.permalink
          : undefined,
    tags: Array.isArray(body.tags)
      ? body.tags.map((entry) => String(entry))
      : undefined,
    publishedAt:
      body.publishedAt === null
        ? null
        : typeof body.publishedAt === "string"
          ? body.publishedAt
          : undefined,
    active: typeof body.active === "boolean" ? body.active : undefined,
    featured: typeof body.featured === "boolean" ? body.featured : undefined,
    showOnHomepage:
      typeof body.showOnHomepage === "boolean" ? body.showOnHomepage : undefined,
    displayOrder:
      typeof body.displayOrder === "number" ? body.displayOrder : undefined,
    isManualLocked:
      typeof body.isManualLocked === "boolean" ? body.isManualLocked : undefined,
  });

  return jsonFromAuthResult(result);
}

export async function DELETE(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const denied = await adminGuardResponse(request);

  if (denied) {
    return denied;
  }

  const { postId } = await context.params;
  const result = await deleteSocialPost(postId);

  return jsonFromAuthResult(result);
}
