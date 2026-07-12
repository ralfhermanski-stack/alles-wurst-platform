/**
 * @file social-media-sync-service.ts
 */

import type { Prisma, SocialMediaPlatform } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

import {
  decryptSocialCredential,
  encryptSocialCredential,
} from "./social-credential-crypto";
import {
  fetchYouTubeChannelInfo,
  fetchYouTubePlaylistVideos,
} from "./providers/youtube-provider";
import type { ImportedSocialPost } from "./social-media-types";

const DEFAULT_SYNC_INTERVALS: Record<SocialMediaPlatform, number> = {
  YOUTUBE: 120,
  INSTAGRAM: 180,
  FACEBOOK: 180,
  TIKTOK: 360,
};

export async function getSocialCredential(
  channelId: string,
  credentialType: string,
): Promise<string | null> {
  const record = await prisma.socialMediaCredential.findUnique({
    where: {
      channelId_credentialType: { channelId, credentialType },
    },
  });

  if (!record) {
    return null;
  }

  return decryptSocialCredential(record.encryptedValue);
}

export async function saveSocialCredential(
  channelId: string,
  credentialType: string,
  value: string,
  expiresAt?: Date | null,
): Promise<void> {
  await prisma.socialMediaCredential.upsert({
    where: {
      channelId_credentialType: { channelId, credentialType },
    },
    create: {
      channelId,
      credentialType,
      encryptedValue: encryptSocialCredential(value),
      expiresAt: expiresAt ?? null,
    },
    update: {
      encryptedValue: encryptSocialCredential(value),
      expiresAt: expiresAt ?? null,
    },
  });
}

async function upsertImportedPosts(
  channelId: string,
  posts: ImportedSocialPost[],
): Promise<{ created: number; updated: number; skipped: number }> {
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const post of posts) {
    const existing = await prisma.socialMediaPost.findUnique({
      where: {
        channelId_externalId: {
          channelId,
          externalId: post.externalId,
        },
      },
    });

    if (existing?.isManualLocked) {
      skipped += 1;
      continue;
    }

    if (existing) {
      await prisma.socialMediaPost.update({
        where: { id: existing.id },
        data: {
          title: post.title,
          content: post.content,
          thumbnailUrl: post.thumbnailUrl,
          mediaUrl: post.mediaUrl,
          permalink: post.permalink,
          tags: post.tags,
          publishedAt: post.publishedAt,
          postType: post.postType,
          isUnavailable: false,
          rawMetadata: post.rawMetadata as Prisma.InputJsonValue | undefined,
        },
      });
      updated += 1;
    } else {
      await prisma.socialMediaPost.create({
        data: {
          channelId,
          externalId: post.externalId,
          sourceType: "API",
          postType: post.postType,
          title: post.title,
          content: post.content,
          thumbnailUrl: post.thumbnailUrl,
          mediaUrl: post.mediaUrl,
          permalink: post.permalink,
          tags: post.tags,
          publishedAt: post.publishedAt,
          active: true,
          rawMetadata: post.rawMetadata as Prisma.InputJsonValue | undefined,
        },
      });
      created += 1;
    }
  }

  return { created, updated, skipped };
}

async function syncYouTubeChannel(
  channelId: string,
): Promise<{ found: number; created: number; updated: number; skipped: number }> {
  const channel = await prisma.socialMediaChannel.findUnique({
    where: { id: channelId },
  });

  if (!channel?.externalChannelId) {
    throw new Error("YouTube-Kanal-ID fehlt.");
  }

  const apiKey =
    (await getSocialCredential(channelId, "api_key")) ??
    process.env.YOUTUBE_API_KEY?.trim() ??
    null;

  if (!apiKey) {
    throw new Error("YouTube API-Key nicht konfiguriert.");
  }

  const channelInfo = await fetchYouTubeChannelInfo({
    apiKey,
    channelId: channel.externalChannelId,
    playlistId: await getSocialCredential(channelId, "playlist_id"),
  });

  const playlistId =
    (await getSocialCredential(channelId, "playlist_id")) ??
    channelInfo.uploadsPlaylistId;

  let posts: ImportedSocialPost[] = [];

  if (playlistId) {
    posts = await fetchYouTubePlaylistVideos({
      apiKey,
      channelId: channel.externalChannelId,
      playlistId,
    });
  }

  const counts = await upsertImportedPosts(channelId, posts);

  await prisma.socialMediaChannel.update({
    where: { id: channelId },
    data: {
      publicName: channelInfo.title ?? channel.publicName,
      followerCount: channelInfo.subscriberCount,
      followerCountUpdatedAt: channelInfo.subscriberCount ? new Date() : null,
      coverImageUrl: channel.coverImageUrl ?? channelInfo.thumbnailUrl,
      connectionStatus: "CONNECTED",
      lastSyncedAt: new Date(),
      lastErrorAt: null,
      lastErrorMessage: null,
    },
  });

  return {
    found: posts.length,
    ...counts,
  };
}

export async function syncSocialMediaChannel(
  channelId: string,
  triggeredBy = "manual",
  userId?: string | null,
): Promise<{ success: boolean; logId: string }> {
  const channel = await prisma.socialMediaChannel.findUnique({
    where: { id: channelId },
  });

  if (!channel || !channel.active) {
    throw new Error("Kanal nicht gefunden oder inaktiv.");
  }

  const log = await prisma.socialMediaSyncLog.create({
    data: {
      channelId,
      platform: channel.platform,
      status: "RUNNING",
      triggeredBy,
      triggeredByUserId: userId ?? null,
    },
  });

  try {
    let result = { found: 0, created: 0, updated: 0, skipped: 0 };

    if (channel.integrationMode === "API") {
      if (channel.platform === "YOUTUBE") {
        result = await syncYouTubeChannel(channelId);
      } else {
        throw new Error(
          `${channel.platform}: API-Synchronisierung noch nicht eingerichtet. Bitte manuellen Modus verwenden.`,
        );
      }
    } else if (channel.integrationMode === "MANUAL") {
      result.skipped = 0;
    } else {
      throw new Error("Synchronisierung für diesen Modus nicht verfügbar.");
    }

    await prisma.socialMediaSyncLog.update({
      where: { id: log.id },
      data: {
        status: "SUCCESS",
        finishedAt: new Date(),
        foundCount: result.found,
        createdCount: result.created,
        updatedCount: result.updated,
        skippedCount: result.skipped,
      },
    });

    return { success: true, logId: log.id };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Synchronisierung fehlgeschlagen.";

    await prisma.socialMediaChannel.update({
      where: { id: channelId },
      data: {
        connectionStatus: "ERROR",
        lastErrorAt: new Date(),
        lastErrorMessage: message.slice(0, 500),
      },
    });

    await prisma.socialMediaSyncLog.update({
      where: { id: log.id },
      data: {
        status: "FAILED",
        finishedAt: new Date(),
        errorMessage: message.slice(0, 500),
        errorCode: "SYNC_FAILED",
      },
    });

    return { success: false, logId: log.id };
  }
}

export async function syncAllDueSocialChannels(
  triggeredBy = "cron",
): Promise<number> {
  const channels = await prisma.socialMediaChannel.findMany({
    where: {
      active: true,
      integrationMode: "API",
      isTestData: false,
    },
  });

  let synced = 0;

  for (const channel of channels) {
    const interval =
      channel.syncIntervalMinutes ||
      DEFAULT_SYNC_INTERVALS[channel.platform];

    const due =
      !channel.lastSyncedAt ||
      Date.now() - channel.lastSyncedAt.getTime() >= interval * 60_000;

    if (!due) {
      continue;
    }

    await syncSocialMediaChannel(channel.id, triggeredBy);
    synced += 1;
  }

  return synced;
}

export function getDefaultSyncInterval(platform: SocialMediaPlatform): number {
  return DEFAULT_SYNC_INTERVALS[platform];
}
