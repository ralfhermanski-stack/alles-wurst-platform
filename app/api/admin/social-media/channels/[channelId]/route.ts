import { adminGuardResponse } from "@/lib/admin/admin-api-utils";
import { jsonFromAuthResult } from "@/lib/auth/auth-api-utils";
import {
  deleteSocialChannel,
  updateSocialChannel,
} from "@/lib/social-media/social-media-admin-service";
import type {
  SocialMediaIntegrationMode,
  SocialMediaPlatform,
} from "@prisma/client";

type RouteContext = {
  params: Promise<{ channelId: string }>;
};

export async function PATCH(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const denied = await adminGuardResponse(request);

  if (denied) {
    return denied;
  }

  const { channelId } = await context.params;
  const body = (await request.json()) as Record<string, unknown>;

  const result = await updateSocialChannel(channelId, {
    platform: body.platform as SocialMediaPlatform | undefined,
    name: typeof body.name === "string" ? body.name : undefined,
    publicName:
      body.publicName === null
        ? null
        : typeof body.publicName === "string"
          ? body.publicName
          : undefined,
    handle:
      body.handle === null
        ? null
        : typeof body.handle === "string"
          ? body.handle
          : undefined,
    profileUrl:
      body.profileUrl === null
        ? null
        : typeof body.profileUrl === "string"
          ? body.profileUrl
          : undefined,
    externalChannelId:
      body.externalChannelId === null
        ? null
        : typeof body.externalChannelId === "string"
          ? body.externalChannelId
          : undefined,
    description:
      body.description === null
        ? null
        : typeof body.description === "string"
          ? body.description
          : undefined,
    icon:
      body.icon === null
        ? null
        : typeof body.icon === "string"
          ? body.icon
          : undefined,
    coverImageUrl:
      body.coverImageUrl === null
        ? null
        : typeof body.coverImageUrl === "string"
          ? body.coverImageUrl
          : undefined,
    integrationMode:
      typeof body.integrationMode === "string"
        ? (body.integrationMode as SocialMediaIntegrationMode)
        : undefined,
    active: typeof body.active === "boolean" ? body.active : undefined,
    showOnHomepage:
      typeof body.showOnHomepage === "boolean" ? body.showOnHomepage : undefined,
    displayOrder:
      typeof body.displayOrder === "number" ? body.displayOrder : undefined,
    ctaLabel:
      body.ctaLabel === null
        ? null
        : typeof body.ctaLabel === "string"
          ? body.ctaLabel
          : undefined,
    ctaUrl:
      body.ctaUrl === null
        ? null
        : typeof body.ctaUrl === "string"
          ? body.ctaUrl
          : undefined,
    showFollowerCount:
      typeof body.showFollowerCount === "boolean"
        ? body.showFollowerCount
        : undefined,
    channelKeywords: Array.isArray(body.channelKeywords)
      ? body.channelKeywords.map((entry) => String(entry))
      : undefined,
    tagSource:
      body.tagSource === "AUTO" ||
      body.tagSource === "MANUAL" ||
      body.tagSource === "MIXED"
        ? body.tagSource
        : undefined,
    manualTags: Array.isArray(body.manualTags)
      ? body.manualTags.map((entry) => String(entry))
      : undefined,
    featuredPostId:
      body.featuredPostId === null
        ? null
        : typeof body.featuredPostId === "string"
          ? body.featuredPostId
          : undefined,
    syncIntervalMinutes:
      typeof body.syncIntervalMinutes === "number"
        ? body.syncIntervalMinutes
        : undefined,
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

  const { channelId } = await context.params;
  const result = await deleteSocialChannel(channelId);

  return jsonFromAuthResult(result);
}
