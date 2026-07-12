/**
 * @file social-media-homepage-service.ts
 * @purpose Startseiten-Daten aus lokaler DB (keine Live-API-Aufrufe).
 */

import { prisma } from "@/lib/db/prisma";

import {
  PLATFORM_ACCENTS,
  PLATFORM_ICONS,
  type HomepageSocialCard,
} from "./social-media-types";

function resolveTags(
  tagSource: string,
  manualTags: string[],
  postTags: string[],
): string[] {
  if (tagSource === "MANUAL") {
    return manualTags.slice(0, 3);
  }

  if (tagSource === "MIXED") {
    const merged = [...manualTags, ...postTags];
    return [...new Set(merged)].slice(0, 3);
  }

  return [...new Set(postTags)].slice(0, 3);
}

export async function getHomepageSocialCards(): Promise<HomepageSocialCard[]> {
  try {
    const channels = await prisma.socialMediaChannel.findMany({
      where: { active: true, showOnHomepage: true, isTestData: false },
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
      include: {
        posts: {
          where: { active: true, isUnavailable: false, isTestData: false },
          orderBy: [{ featured: "desc" }, { publishedAt: "desc" }, { createdAt: "desc" }],
          take: 3,
        },
      },
    });

    return channels
      .filter((channel) => {
        const linkUrl = channel.ctaUrl ?? channel.profileUrl;
        return Boolean(linkUrl && linkUrl !== "#" && channel.name.trim());
      })
      .map((channel) => {
      const featured =
        channel.posts.find((post) => post.id === channel.featuredPostId) ??
        channel.posts[0] ??
        null;

      const postTags = channel.posts.flatMap((post) => post.tags);
      const tags = resolveTags(channel.tagSource, channel.manualTags, postTags);

      const previewItems =
        channel.posts.length > 0
          ? channel.posts.map((post) => ({
              label: post.title?.slice(0, 24) ?? "Beitrag",
              thumbnailUrl:
                post.localThumbnailUrl ?? post.thumbnailUrl ?? channel.coverImageUrl,
            }))
          : tags.map((tag) => ({
              label: tag,
              thumbnailUrl: channel.coverImageUrl,
            }));

      const linkUrl = channel.ctaUrl ?? channel.profileUrl ?? "#";
      const showFollowers =
        channel.showFollowerCount &&
        channel.followerCount !== null &&
        channel.followerCount > 0 &&
        channel.connectionStatus === "CONNECTED";

      return {
        id: channel.id,
        platform: channel.platform,
        icon: channel.icon ?? PLATFORM_ICONS[channel.platform],
        name: channel.name,
        publicName: channel.publicName ?? channel.name,
        description: channel.description ?? "",
        profileUrl: linkUrl,
        latestPostUrl: featured?.permalink ?? null,
        followerCount: showFollowers ? channel.followerCount : null,
        showFollowerCount: showFollowers,
        coverImageUrl: channel.coverImageUrl,
        tags,
        previewItems: previewItems.slice(0, 3),
        accent: PLATFORM_ACCENTS[channel.platform],
        ctaLabel: channel.ctaLabel ?? "Profil öffnen",
      };
    });
  } catch {
    return [];
  }
}
