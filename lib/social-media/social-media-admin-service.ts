/**
 * @file social-media-admin-service.ts
 * @purpose Admin-CRUD für Social-Media-Kanäle, Beiträge und Sync-Protokoll.
 */

import type {
  Prisma,
  SocialMediaIntegrationMode,
  SocialMediaPlatform,
  SocialMediaPostType,
} from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import {
  userFailure,
  userSuccess,
  type UserServiceResult,
} from "@/lib/users/user-errors";

import { getDefaultSyncInterval } from "./social-media-sync-service";
import { validateSocialProfileUrl, validatePostUrl } from "./social-media-url-validation";
import type {
  SocialMediaChannelEntry,
  SocialMediaPostEntry,
  SocialMediaSyncLogEntry,
} from "./social-media-types";

function toChannelEntry(channel: {
  id: string;
  platform: SocialMediaPlatform;
  name: string;
  publicName: string | null;
  handle: string | null;
  profileUrl: string | null;
  externalChannelId: string | null;
  description: string | null;
  icon: string | null;
  coverImageUrl: string | null;
  active: boolean;
  showOnHomepage: boolean;
  displayOrder: number;
  integrationMode: SocialMediaIntegrationMode;
  connectionStatus: string;
  ctaLabel: string | null;
  ctaUrl: string | null;
  followerCount: number | null;
  followerCountUpdatedAt: Date | null;
  showFollowerCount: boolean;
  channelKeywords: string[];
  tagSource: string;
  manualTags: string[];
  featuredPostId: string | null;
  lastSyncedAt: Date | null;
  lastErrorAt: Date | null;
  lastErrorMessage: string | null;
  syncIntervalMinutes: number;
  createdAt: Date;
  updatedAt: Date;
}): SocialMediaChannelEntry {
  return {
    id: channel.id,
    platform: channel.platform,
    name: channel.name,
    publicName: channel.publicName,
    handle: channel.handle,
    profileUrl: channel.profileUrl,
    externalChannelId: channel.externalChannelId,
    description: channel.description,
    icon: channel.icon,
    coverImageUrl: channel.coverImageUrl,
    active: channel.active,
    showOnHomepage: channel.showOnHomepage,
    displayOrder: channel.displayOrder,
    integrationMode: channel.integrationMode,
    connectionStatus: channel.connectionStatus as SocialMediaChannelEntry["connectionStatus"],
    ctaLabel: channel.ctaLabel,
    ctaUrl: channel.ctaUrl,
    followerCount: channel.followerCount,
    followerCountUpdatedAt: channel.followerCountUpdatedAt?.toISOString() ?? null,
    showFollowerCount: channel.showFollowerCount,
    channelKeywords: channel.channelKeywords,
    tagSource: channel.tagSource as SocialMediaChannelEntry["tagSource"],
    manualTags: channel.manualTags,
    featuredPostId: channel.featuredPostId,
    lastSyncedAt: channel.lastSyncedAt?.toISOString() ?? null,
    lastErrorAt: channel.lastErrorAt?.toISOString() ?? null,
    lastErrorMessage: channel.lastErrorMessage,
    syncIntervalMinutes: channel.syncIntervalMinutes,
    createdAt: channel.createdAt.toISOString(),
    updatedAt: channel.updatedAt.toISOString(),
  };
}

function toPostEntry(post: {
  id: string;
  channelId: string;
  externalId: string | null;
  sourceType: string;
  postType: string;
  title: string | null;
  content: string | null;
  thumbnailUrl: string | null;
  localThumbnailUrl: string | null;
  mediaUrl: string | null;
  permalink: string | null;
  tags: string[];
  publishedAt: Date | null;
  active: boolean;
  featured: boolean;
  showOnHomepage: boolean;
  displayOrder: number;
  isManualLocked: boolean;
  isUnavailable: boolean;
}): SocialMediaPostEntry {
  return {
    id: post.id,
    channelId: post.channelId,
    externalId: post.externalId,
    sourceType: post.sourceType as SocialMediaPostEntry["sourceType"],
    postType: post.postType as SocialMediaPostEntry["postType"],
    title: post.title,
    content: post.content,
    thumbnailUrl: post.thumbnailUrl,
    localThumbnailUrl: post.localThumbnailUrl,
    mediaUrl: post.mediaUrl,
    permalink: post.permalink,
    tags: post.tags,
    publishedAt: post.publishedAt?.toISOString() ?? null,
    active: post.active,
    featured: post.featured,
    showOnHomepage: post.showOnHomepage,
    displayOrder: post.displayOrder,
    isManualLocked: post.isManualLocked,
    isUnavailable: post.isUnavailable,
  };
}

function toSyncLogEntry(log: {
  id: string;
  channelId: string | null;
  platform: SocialMediaPlatform | null;
  status: string;
  startedAt: Date;
  finishedAt: Date | null;
  foundCount: number;
  createdCount: number;
  updatedCount: number;
  skippedCount: number;
  errorCode: string | null;
  errorMessage: string | null;
  triggeredBy: string;
}): SocialMediaSyncLogEntry {
  return {
    id: log.id,
    channelId: log.channelId,
    platform: log.platform,
    status: log.status as SocialMediaSyncLogEntry["status"],
    startedAt: log.startedAt.toISOString(),
    finishedAt: log.finishedAt?.toISOString() ?? null,
    foundCount: log.foundCount,
    createdCount: log.createdCount,
    updatedCount: log.updatedCount,
    skippedCount: log.skippedCount,
    errorCode: log.errorCode,
    errorMessage: log.errorMessage,
    triggeredBy: log.triggeredBy,
  };
}

export type CreateSocialChannelInput = {
  platform: SocialMediaPlatform;
  name: string;
  publicName?: string | null;
  handle?: string | null;
  profileUrl?: string | null;
  externalChannelId?: string | null;
  description?: string | null;
  integrationMode?: SocialMediaIntegrationMode;
  active?: boolean;
  showOnHomepage?: boolean;
  displayOrder?: number;
};

export type UpdateSocialChannelInput = Partial<CreateSocialChannelInput> & {
  icon?: string | null;
  coverImageUrl?: string | null;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  showFollowerCount?: boolean;
  channelKeywords?: string[];
  tagSource?: "AUTO" | "MANUAL" | "MIXED";
  manualTags?: string[];
  featuredPostId?: string | null;
  syncIntervalMinutes?: number;
  connectionStatus?: string;
};

export type CreateSocialPostInput = {
  channelId: string;
  title?: string | null;
  content?: string | null;
  postType?: SocialMediaPostType;
  thumbnailUrl?: string | null;
  mediaUrl?: string | null;
  permalink?: string | null;
  tags?: string[];
  publishedAt?: string | null;
  active?: boolean;
  featured?: boolean;
  showOnHomepage?: boolean;
  displayOrder?: number;
  isManualLocked?: boolean;
};

export type UpdateSocialPostInput = Partial<CreateSocialPostInput>;

export async function listAdminSocialChannels(): Promise<SocialMediaChannelEntry[]> {
  const channels = await prisma.socialMediaChannel.findMany({
    orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
  });

  return channels.map(toChannelEntry);
}

export async function createSocialChannel(
  input: CreateSocialChannelInput,
): Promise<UserServiceResult<SocialMediaChannelEntry>> {
  const name = input.name.trim();

  if (!name) {
    return userFailure({
      code: "VALIDATION_ERROR",
      message: "Kanalname ist erforderlich.",
    });
  }

  const profileUrl = input.profileUrl?.trim() || null;

  if (profileUrl) {
    const urlCheck = validateSocialProfileUrl(input.platform, profileUrl);

    if (!urlCheck.valid) {
      return userFailure({
        code: "VALIDATION_ERROR",
        message: urlCheck.message ?? "Ungültige Profil-URL.",
      });
    }
  }

  const externalChannelId = input.externalChannelId?.trim() || null;

  const duplicate = await prisma.socialMediaChannel.findFirst({
    where: {
      isTestData: false,
      platform: input.platform,
      OR: [
        ...(profileUrl ? [{ profileUrl }] : []),
        ...(externalChannelId ? [{ externalChannelId }] : []),
        { name, platform: input.platform },
      ],
    },
  });

  if (duplicate) {
    return userFailure({
      code: "VALIDATION_ERROR",
      message: "Ein identischer Kanal für diese Plattform existiert bereits.",
    });
  }

  const channel = await prisma.socialMediaChannel.create({
    data: {
      platform: input.platform,
      name,
      publicName: input.publicName?.trim() || null,
      handle: input.handle?.trim() || null,
      profileUrl: input.profileUrl?.trim() || null,
      externalChannelId: input.externalChannelId?.trim() || null,
      description: input.description?.trim() || null,
      integrationMode: input.integrationMode ?? "MANUAL",
      active: input.active ?? true,
      showOnHomepage: input.showOnHomepage ?? true,
      displayOrder: input.displayOrder ?? 0,
      syncIntervalMinutes: getDefaultSyncInterval(input.platform),
    },
  });

  return userSuccess(toChannelEntry(channel));
}

export async function updateSocialChannel(
  channelId: string,
  input: UpdateSocialChannelInput,
): Promise<UserServiceResult<SocialMediaChannelEntry>> {
  const existing = await prisma.socialMediaChannel.findUnique({
    where: { id: channelId },
  });

  if (!existing) {
    return userFailure({
      code: "NOT_FOUND",
      message: "Kanal nicht gefunden.",
    });
  }

  const data: Prisma.SocialMediaChannelUpdateInput = {};

  if (input.name !== undefined) {
    data.name = input.name.trim();
  }
  if (input.platform !== undefined) {
    data.platform = input.platform;
  }
  if (input.publicName !== undefined) {
    data.publicName = input.publicName?.trim() || null;
  }
  if (input.handle !== undefined) {
    data.handle = input.handle?.trim() || null;
  }
  if (input.profileUrl !== undefined) {
    const profileUrl = input.profileUrl?.trim() || null;

    if (profileUrl) {
      const platform = input.platform ?? existing.platform;
      const urlCheck = validateSocialProfileUrl(platform, profileUrl);

      if (!urlCheck.valid) {
        return userFailure({
          code: "VALIDATION_ERROR",
          message: urlCheck.message ?? "Ungültige Profil-URL.",
        });
      }
    }

    data.profileUrl = profileUrl;
  }
  if (input.externalChannelId !== undefined) {
    data.externalChannelId = input.externalChannelId?.trim() || null;
  }
  if (input.description !== undefined) {
    data.description = input.description?.trim() || null;
  }
  if (input.icon !== undefined) {
    data.icon = input.icon?.trim() || null;
  }
  if (input.coverImageUrl !== undefined) {
    data.coverImageUrl = input.coverImageUrl?.trim() || null;
  }
  if (input.integrationMode !== undefined) {
    data.integrationMode = input.integrationMode;
  }
  if (input.active !== undefined) {
    data.active = input.active;
  }
  if (input.showOnHomepage !== undefined) {
    data.showOnHomepage = input.showOnHomepage;
  }
  if (input.displayOrder !== undefined) {
    data.displayOrder = input.displayOrder;
  }
  if (input.ctaLabel !== undefined) {
    data.ctaLabel = input.ctaLabel?.trim() || null;
  }
  if (input.ctaUrl !== undefined) {
    data.ctaUrl = input.ctaUrl?.trim() || null;
  }
  if (input.showFollowerCount !== undefined) {
    data.showFollowerCount = input.showFollowerCount;
  }
  if (input.channelKeywords !== undefined) {
    data.channelKeywords = input.channelKeywords;
  }
  if (input.tagSource !== undefined) {
    data.tagSource = input.tagSource;
  }
  if (input.manualTags !== undefined) {
    data.manualTags = input.manualTags;
  }
  if (input.featuredPostId !== undefined) {
    data.featuredPost =
      input.featuredPostId === null
        ? { disconnect: true }
        : { connect: { id: input.featuredPostId } };
  }
  if (input.syncIntervalMinutes !== undefined) {
    data.syncIntervalMinutes = input.syncIntervalMinutes;
  }
  if (input.connectionStatus !== undefined) {
    data.connectionStatus =
      input.connectionStatus as Prisma.SocialMediaChannelUpdateInput["connectionStatus"];
  }

  const channel = await prisma.socialMediaChannel.update({
    where: { id: channelId },
    data,
  });

  return userSuccess(toChannelEntry(channel));
}

export async function deleteSocialChannel(
  channelId: string,
): Promise<UserServiceResult<{ id: string }>> {
  const existing = await prisma.socialMediaChannel.findUnique({
    where: { id: channelId },
  });

  if (!existing) {
    return userFailure({
      code: "NOT_FOUND",
      message: "Kanal nicht gefunden.",
    });
  }

  await prisma.socialMediaChannel.delete({ where: { id: channelId } });

  return userSuccess({ id: channelId });
}

export async function listAdminSocialPosts(filters?: {
  channelId?: string;
  active?: boolean;
}): Promise<SocialMediaPostEntry[]> {
  const posts = await prisma.socialMediaPost.findMany({
    where: {
      channelId: filters?.channelId,
      active: filters?.active,
    },
    orderBy: [
      { featured: "desc" },
      { publishedAt: "desc" },
      { createdAt: "desc" },
    ],
  });

  return posts.map(toPostEntry);
}

export async function createSocialPost(
  input: CreateSocialPostInput,
): Promise<UserServiceResult<SocialMediaPostEntry>> {
  const channel = await prisma.socialMediaChannel.findUnique({
    where: { id: input.channelId },
  });

  if (!channel) {
    return userFailure({
      code: "NOT_FOUND",
      message: "Kanal nicht gefunden.",
    });
  }

  if (!channel.active) {
    return userFailure({
      code: "VALIDATION_ERROR",
      message: "Beiträge können nur für aktive Kanäle angelegt werden.",
    });
  }

  const permalink = input.permalink?.trim() || null;

  if (permalink) {
    const urlCheck = validatePostUrl(permalink);

    if (!urlCheck.valid) {
      return userFailure({
        code: "VALIDATION_ERROR",
        message: urlCheck.message ?? "Ungültige Beitrags-URL.",
      });
    }

    const duplicate = await prisma.socialMediaPost.findFirst({
      where: {
        channelId: input.channelId,
        permalink,
        isTestData: false,
      },
    });

    if (duplicate) {
      return userFailure({
        code: "VALIDATION_ERROR",
        message: "Ein Beitrag mit dieser URL existiert bereits.",
      });
    }
  }

  const post = await prisma.socialMediaPost.create({
    data: {
      channelId: input.channelId,
      sourceType: "MANUAL",
      postType: input.postType ?? "POST",
      title: input.title?.trim() || null,
      content: input.content?.trim() || null,
      thumbnailUrl: input.thumbnailUrl?.trim() || null,
      mediaUrl: input.mediaUrl?.trim() || null,
      permalink: input.permalink?.trim() || null,
      tags: input.tags ?? [],
      publishedAt: input.publishedAt ? new Date(input.publishedAt) : new Date(),
      active: input.active ?? true,
      featured: input.featured ?? false,
      showOnHomepage: input.showOnHomepage ?? false,
      displayOrder: input.displayOrder ?? 0,
      isManualLocked: input.isManualLocked ?? true,
    },
  });

  return userSuccess(toPostEntry(post));
}

export async function updateSocialPost(
  postId: string,
  input: UpdateSocialPostInput,
): Promise<UserServiceResult<SocialMediaPostEntry>> {
  const existing = await prisma.socialMediaPost.findUnique({
    where: { id: postId },
  });

  if (!existing) {
    return userFailure({
      code: "NOT_FOUND",
      message: "Beitrag nicht gefunden.",
    });
  }

  const data: Prisma.SocialMediaPostUpdateInput = {};

  if (input.channelId !== undefined) {
    data.channel = { connect: { id: input.channelId } };
  }
  if (input.title !== undefined) {
    data.title = input.title?.trim() || null;
  }
  if (input.content !== undefined) {
    data.content = input.content?.trim() || null;
  }
  if (input.postType !== undefined) {
    data.postType = input.postType;
  }
  if (input.thumbnailUrl !== undefined) {
    data.thumbnailUrl = input.thumbnailUrl?.trim() || null;
  }
  if (input.mediaUrl !== undefined) {
    data.mediaUrl = input.mediaUrl?.trim() || null;
  }
  if (input.permalink !== undefined) {
    data.permalink = input.permalink?.trim() || null;
  }
  if (input.tags !== undefined) {
    data.tags = input.tags;
  }
  if (input.publishedAt !== undefined) {
    data.publishedAt = input.publishedAt ? new Date(input.publishedAt) : null;
  }
  if (input.active !== undefined) {
    data.active = input.active;
  }
  if (input.featured !== undefined) {
    data.featured = input.featured;
  }
  if (input.showOnHomepage !== undefined) {
    data.showOnHomepage = input.showOnHomepage;
  }
  if (input.displayOrder !== undefined) {
    data.displayOrder = input.displayOrder;
  }
  if (input.isManualLocked !== undefined) {
    data.isManualLocked = input.isManualLocked;
  }

  const post = await prisma.socialMediaPost.update({
    where: { id: postId },
    data,
  });

  return userSuccess(toPostEntry(post));
}

export async function deleteSocialPost(
  postId: string,
): Promise<UserServiceResult<{ id: string }>> {
  const existing = await prisma.socialMediaPost.findUnique({
    where: { id: postId },
  });

  if (!existing) {
    return userFailure({
      code: "NOT_FOUND",
      message: "Beitrag nicht gefunden.",
    });
  }

  await prisma.socialMediaPost.delete({ where: { id: postId } });

  return userSuccess({ id: postId });
}

export async function listSocialSyncLogs(filters?: {
  channelId?: string;
  limit?: number;
}): Promise<SocialMediaSyncLogEntry[]> {
  const logs = await prisma.socialMediaSyncLog.findMany({
    where: {
      channelId: filters?.channelId,
    },
    orderBy: { startedAt: "desc" },
    take: filters?.limit ?? 100,
  });

  return logs.map(toSyncLogEntry);
}

export async function listChannelCredentialTypes(
  channelId: string,
): Promise<UserServiceResult<string[]>> {
  const credentials = await prisma.socialMediaCredential.findMany({
    where: { channelId },
    select: { credentialType: true },
  });

  return userSuccess(credentials.map((entry) => entry.credentialType));
}
