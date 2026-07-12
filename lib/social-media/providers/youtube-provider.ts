/**
 * @file youtube-provider.ts
 * @purpose YouTube Data API v3 — Kanal + Upload-Playlist.
 */

import type { ImportedSocialPost } from "../social-media-types";

type YouTubeSyncInput = {
  apiKey: string;
  channelId: string;
  playlistId?: string | null;
};

type YouTubeChannelResult = {
  subscriberCount: number | null;
  title: string | null;
  thumbnailUrl: string | null;
  uploadsPlaylistId: string | null;
};

export async function fetchYouTubeChannelInfo(
  input: YouTubeSyncInput,
): Promise<YouTubeChannelResult> {
  const params = new URLSearchParams({
    part: "snippet,statistics,contentDetails",
    id: input.channelId,
    key: input.apiKey,
  });

  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/channels?${params.toString()}`,
    { next: { revalidate: 0 } },
  );

  if (!response.ok) {
    throw new Error(`YouTube-Kanal konnte nicht geladen werden (${response.status}).`);
  }

  const json = (await response.json()) as {
    items?: Array<{
      snippet?: { title?: string; thumbnails?: { high?: { url?: string } } };
      statistics?: { subscriberCount?: string; hiddenSubscriberCount?: boolean };
      contentDetails?: { relatedPlaylists?: { uploads?: string } };
    }>;
  };

  const item = json.items?.[0];

  if (!item) {
    throw new Error("YouTube-Kanal nicht gefunden.");
  }

  const hidden = item.statistics?.hiddenSubscriberCount === true;
  const subscriberCount = hidden
    ? null
    : item.statistics?.subscriberCount
      ? Number.parseInt(item.statistics.subscriberCount, 10)
      : null;

  return {
    subscriberCount: Number.isFinite(subscriberCount) ? subscriberCount : null,
    title: item.snippet?.title ?? null,
    thumbnailUrl: item.snippet?.thumbnails?.high?.url ?? null,
    uploadsPlaylistId: item.contentDetails?.relatedPlaylists?.uploads ?? null,
  };
}

export async function fetchYouTubePlaylistVideos(
  input: YouTubeSyncInput & { playlistId: string },
  limit = 6,
): Promise<ImportedSocialPost[]> {
  const params = new URLSearchParams({
    part: "snippet,contentDetails",
    playlistId: input.playlistId,
    maxResults: String(Math.min(limit, 10)),
    key: input.apiKey,
  });

  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/playlistItems?${params.toString()}`,
    { next: { revalidate: 0 } },
  );

  if (!response.ok) {
    throw new Error(`YouTube-Videos konnten nicht geladen werden (${response.status}).`);
  }

  const json = (await response.json()) as {
    items?: Array<{
      snippet?: {
        title?: string;
        description?: string;
        publishedAt?: string;
        thumbnails?: { high?: { url?: string }; medium?: { url?: string } };
      };
      contentDetails?: { videoId?: string };
    }>;
  };

  return (json.items ?? []).map((item) => {
    const videoId = item.contentDetails?.videoId ?? "";

    return {
      externalId: videoId,
      postType: "VIDEO" as const,
      title: item.snippet?.title ?? null,
      content: item.snippet?.description?.slice(0, 500) ?? null,
      thumbnailUrl:
        item.snippet?.thumbnails?.high?.url ??
        item.snippet?.thumbnails?.medium?.url ??
        null,
      mediaUrl: videoId ? `https://www.youtube.com/watch?v=${videoId}` : null,
      permalink: videoId ? `https://www.youtube.com/watch?v=${videoId}` : null,
      tags: [],
      publishedAt: item.snippet?.publishedAt
        ? new Date(item.snippet.publishedAt)
        : null,
      rawMetadata: { videoId },
    };
  });
}
