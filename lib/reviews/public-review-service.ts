/**
 * @file public-review-service.ts
 * @purpose Vereinigt freigegebene Kurs- und Plattformbewertungen für die Startseite.
 */

import type { PlatformReviewFocus } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

import {
  countPublicMembers,
  formatPublicMemberCount,
  REGISTERED_PUBLIC_MEMBER_WHERE,
} from "./member-count-service";
import { getHomepageCommunityReviewsSettings } from "./homepage-reviews-settings-service";
import type {
  HomepageReviewsPayload,
  PublicReviewEntry,
  PublicReviewFocus,
  PublicReviewSource,
} from "./public-review-types";

function getPublicUserFilter() {
  return REGISTERED_PUBLIC_MEMBER_WHERE;
}

const MAX_REVIEWS = 20;

function mapFocus(focus: PlatformReviewFocus | "course"): PublicReviewFocus | "course" {
  if (focus === "course") {
    return "course";
  }

  return focus;
}

function mixReviews(
  featured: PublicReviewEntry[],
  regular: PublicReviewEntry[],
  limit: number,
): PublicReviewEntry[] {
  const result: PublicReviewEntry[] = [];
  let fi = 0;
  let ri = 0;

  while (result.length < limit && (fi < featured.length || ri < regular.length)) {
    if (fi < featured.length) {
      result.push(featured[fi]);
      fi += 1;
    }

    if (result.length < limit && ri < regular.length) {
      result.push(regular[ri]);
      ri += 1;
    }
  }

  return result;
}

function toEntryFromCourse(review: {
  id: string;
  rating: number;
  reviewText: string | null;
  displayNameSnapshot: string | null;
  avatarUrlSnapshot: string | null;
  showMembershipSnapshot: boolean;
  membershipLabelSnapshot: string | null;
  courseTitleSnapshot: string | null;
  featuredOnHomepage: boolean;
  publishedAt: Date | null;
  createdAt: Date;
  course: { title: string };
}): PublicReviewEntry | null {
  const content = review.reviewText?.trim();

  if (!content) {
    return null;
  }

  const publishedAt = review.publishedAt ?? review.createdAt;

  return {
    id: review.id,
    source: "course",
    rating: review.rating,
    title: null,
    content,
    displayName: review.displayNameSnapshot ?? "Wurstfreund",
    avatarUrl: review.avatarUrlSnapshot,
    membershipLabel: review.showMembershipSnapshot
      ? review.membershipLabelSnapshot
      : null,
    focus: "course",
    courseTitle: review.courseTitleSnapshot ?? review.course.title,
    featuredOnHomepage: review.featuredOnHomepage,
    publishedAt: publishedAt.toISOString(),
  };
}

function toEntryFromPlatform(review: {
  id: string;
  rating: number;
  title: string | null;
  content: string;
  focus: PlatformReviewFocus;
  displayNameSnapshot: string | null;
  avatarUrlSnapshot: string | null;
  showMembership: boolean;
  membershipLabelSnapshot: string | null;
  featuredOnHomepage: boolean;
  publishedAt: Date | null;
  createdAt: Date;
}): PublicReviewEntry {
  const publishedAt = review.publishedAt ?? review.createdAt;

  return {
    id: review.id,
    source: "platform",
    rating: review.rating,
    title: review.title,
    content: review.content,
    displayName: review.displayNameSnapshot ?? "Wurstfreund",
    avatarUrl: review.avatarUrlSnapshot,
    membershipLabel: review.showMembership
      ? review.membershipLabelSnapshot
      : null,
    focus: mapFocus(review.focus),
    courseTitle: null,
    featuredOnHomepage: review.featuredOnHomepage,
    publishedAt: publishedAt.toISOString(),
  };
}

export async function getPublicHomepageReviews(
  limit = MAX_REVIEWS,
): Promise<HomepageReviewsPayload> {
  const settings = await getHomepageCommunityReviewsSettings();

  const [courseReviews, platformReviews, memberCountRaw, statsAggregate] =
    await Promise.all([
      prisma.courseReview.findMany({
        where: {
          status: "approved",
          reviewText: { not: null },
          user: getPublicUserFilter(),
        },
        include: {
          course: { select: { title: true } },
        },
        orderBy: [{ featuredOnHomepage: "desc" }, { publishedAt: "desc" }, { createdAt: "desc" }],
        take: limit * 2,
      }),
      prisma.platformReview.findMany({
        where: {
          moderationStatus: "approved",
          publicConsent: true,
          user: getPublicUserFilter(),
        },
        orderBy: [{ featuredOnHomepage: "desc" }, { publishedAt: "desc" }, { createdAt: "desc" }],
        take: limit * 2,
      }),
      countPublicMembers(),
      getPublicReviewStats(),
    ]);

  const courseEntries = courseReviews
    .map(toEntryFromCourse)
    .filter((entry): entry is PublicReviewEntry => entry !== null);

  const platformEntries = platformReviews.map(toEntryFromPlatform);

  const allEntries = [...courseEntries, ...platformEntries];
  const featured = allEntries
    .filter((entry) => entry.featuredOnHomepage)
    .sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    );
  const regular = allEntries
    .filter((entry) => !entry.featuredOnHomepage)
    .sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    );

  const reviews = mixReviews(featured, regular, limit);
  const memberCount = formatPublicMemberCount(
    memberCountRaw,
    settings.memberCountDisplay,
  );

  const showAverage =
    settings.showAverageRating &&
    statsAggregate.reviewCount >= settings.minReviewsForAverage;

  return {
    reviews,
    stats: {
      reviewCount: statsAggregate.reviewCount,
      averageRating: showAverage ? statsAggregate.averageRating : null,
      memberCount,
      memberCountDisplay: settings.memberCountDisplay,
      showAverageRating: settings.showAverageRating,
      minReviewsForAverage: settings.minReviewsForAverage,
    },
    emptyStateMode: settings.emptyStateMode,
  };
}

export async function getPublicReviewStats(): Promise<{
  reviewCount: number;
  averageRating: number | null;
}> {
  const [courseAgg, platformAgg] = await Promise.all([
    prisma.courseReview.aggregate({
      where: {
        status: "approved",
        reviewText: { not: null },
        user: getPublicUserFilter(),
      },
      _avg: { rating: true },
      _count: { _all: true },
    }),
    prisma.platformReview.aggregate({
      where: {
        moderationStatus: "approved",
        publicConsent: true,
        user: getPublicUserFilter(),
      },
      _avg: { rating: true },
      _count: { _all: true },
    }),
  ]);

  const reviewCount = courseAgg._count._all + platformAgg._count._all;
  const totalRating =
    (courseAgg._avg.rating ?? 0) * courseAgg._count._all +
    (platformAgg._avg.rating ?? 0) * platformAgg._count._all;

  const averageRating =
    reviewCount > 0 ? Math.round((totalRating / reviewCount) * 10) / 10 : null;

  return { reviewCount, averageRating };
}

export type { PublicReviewSource };
