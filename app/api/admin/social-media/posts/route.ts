import { adminGuardResponse } from "@/lib/admin/admin-api-utils";
import { jsonFromAuthResult } from "@/lib/auth/auth-api-utils";
import {
  createSocialPost,
  listAdminSocialPosts,
} from "@/lib/social-media/social-media-admin-service";
import type { SocialMediaPostType } from "@prisma/client";

export async function GET(request: Request): Promise<Response> {
  const denied = await adminGuardResponse(request);

  if (denied) {
    return denied;
  }

  const url = new URL(request.url);
  const channelId = url.searchParams.get("channelId") ?? undefined;
  const activeParam = url.searchParams.get("active");
  const active =
    activeParam === "true" ? true : activeParam === "false" ? false : undefined;

  const posts = await listAdminSocialPosts({ channelId, active });

  return jsonFromAuthResult({ success: true, data: posts });
}

export async function POST(request: Request): Promise<Response> {
  const denied = await adminGuardResponse(request);

  if (denied) {
    return denied;
  }

  const body = (await request.json()) as Record<string, unknown>;
  const channelId = typeof body.channelId === "string" ? body.channelId : "";

  if (!channelId) {
    return jsonFromAuthResult({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Kanal ist erforderlich.",
      },
    });
  }

  const result = await createSocialPost({
    channelId,
    title: typeof body.title === "string" ? body.title : null,
    content: typeof body.content === "string" ? body.content : null,
    postType:
      typeof body.postType === "string"
        ? (body.postType as SocialMediaPostType)
        : undefined,
    thumbnailUrl: typeof body.thumbnailUrl === "string" ? body.thumbnailUrl : null,
    mediaUrl: typeof body.mediaUrl === "string" ? body.mediaUrl : null,
    permalink: typeof body.permalink === "string" ? body.permalink : null,
    tags: Array.isArray(body.tags) ? body.tags.map((entry) => String(entry)) : [],
    publishedAt: typeof body.publishedAt === "string" ? body.publishedAt : null,
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
