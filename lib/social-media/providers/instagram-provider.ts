/**
 * @file instagram-provider.ts
 * @purpose Instagram Graph API — Profil + Medien (Business/Creator-Konten).
 */

import type { SocialMediaPostType } from "@prisma/client";

import type { ImportedSocialPost } from "../social-media-types";

const GRAPH_API_VERSION = "v21.0";
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

type InstagramSyncInput = {
  accessToken: string;
  accountId: string;
};

type InstagramAccountResult = {
  username: string | null;
  name: string | null;
  profilePictureUrl: string | null;
  followerCount: number | null;
  mediaCount: number | null;
};

type InstagramMediaItem = {
  id: string;
  caption?: string;
  media_type?: string;
  media_url?: string;
  thumbnail_url?: string;
  permalink?: string;
  timestamp?: string;
  children?: {
    data?: Array<{
      media_url?: string;
      media_type?: string;
      thumbnail_url?: string;
    }>;
  };
};

type GraphErrorBody = {
  error?: {
    message?: string;
    code?: number;
    type?: string;
  };
};

async function graphFetch<T>(path: string, accessToken: string): Promise<T> {
  const url = new URL(`${GRAPH_BASE}${path}`);
  url.searchParams.set("access_token", accessToken);

  const response = await fetch(url.toString(), { next: { revalidate: 0 } });
  const json = (await response.json()) as T & GraphErrorBody;

  if (!response.ok || json.error) {
    const message =
      json.error?.message ??
      `Instagram Graph API Fehler (${response.status}).`;
    throw new Error(message);
  }

  return json;
}

function mapMediaType(
  mediaType: string | undefined,
  permalink: string | null,
): SocialMediaPostType {
  if (mediaType === "CAROUSEL_ALBUM") {
    return "CAROUSEL";
  }

  if (mediaType === "VIDEO") {
    return permalink?.includes("/reel/") ? "REEL" : "VIDEO";
  }

  return "IMAGE";
}

function resolveThumbnail(item: InstagramMediaItem): string | null {
  if (item.thumbnail_url) {
    return item.thumbnail_url;
  }

  if (item.media_type === "IMAGE" && item.media_url) {
    return item.media_url;
  }

  const firstChild = item.children?.data?.[0];

  if (firstChild?.thumbnail_url) {
    return firstChild.thumbnail_url;
  }

  if (firstChild?.media_url) {
    return firstChild.media_url;
  }

  return item.media_url ?? null;
}

function mapMediaItem(item: InstagramMediaItem): ImportedSocialPost {
  const caption = item.caption?.trim() ?? "";
  const title =
    caption.split("\n")[0]?.slice(0, 120) ||
    (item.media_type === "VIDEO" ? "Video" : "Beitrag");

  return {
    externalId: item.id,
    postType: mapMediaType(item.media_type, item.permalink ?? null),
    title,
    content: caption.slice(0, 500) || null,
    thumbnailUrl: resolveThumbnail(item),
    mediaUrl: item.media_url ?? item.permalink ?? null,
    permalink: item.permalink ?? null,
    tags: [],
    publishedAt: item.timestamp ? new Date(item.timestamp) : null,
    rawMetadata: {
      mediaType: item.media_type,
      instagramId: item.id,
    },
  };
}

export async function fetchInstagramAccountInfo(
  input: InstagramSyncInput,
): Promise<InstagramAccountResult> {
  const json = await graphFetch<{
    id?: string;
    username?: string;
    name?: string;
    profile_picture_url?: string;
    followers_count?: number;
    media_count?: number;
  }>(
    `/${input.accountId}?fields=id,username,name,profile_picture_url,followers_count,media_count`,
    input.accessToken,
  );

  return {
    username: json.username ?? null,
    name: json.name ?? json.username ?? null,
    profilePictureUrl: json.profile_picture_url ?? null,
    followerCount:
      typeof json.followers_count === "number" ? json.followers_count : null,
    mediaCount: typeof json.media_count === "number" ? json.media_count : null,
  };
}

export async function fetchInstagramMedia(
  input: InstagramSyncInput,
  limit = 12,
): Promise<ImportedSocialPost[]> {
  const fields =
    "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,children{media_url,media_type,thumbnail_url}";

  const json = await graphFetch<{ data?: InstagramMediaItem[] }>(
    `/${input.accountId}/media?fields=${encodeURIComponent(fields)}&limit=${Math.min(limit, 25)}`,
    input.accessToken,
  );

  return (json.data ?? [])
    .filter((item) => Boolean(item.id))
    .map(mapMediaItem);
}
