/**
 * @file homepage-reviews-settings-service.ts
 */

import type {
  HomepageReviewsEmptyMode,
  MemberCountDisplayMode,
  PlatformReviewEligibilityRule,
} from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

export type HomepageCommunityReviewsSettings = {
  memberCountDisplay: MemberCountDisplayMode;
  showAverageRating: boolean;
  minReviewsForAverage: number;
  emptyStateMode: HomepageReviewsEmptyMode;
  eligibilityRule: PlatformReviewEligibilityRule;
  minRegistrationDays: number;
};

const DEFAULTS: HomepageCommunityReviewsSettings = {
  memberCountDisplay: "exact",
  showAverageRating: true,
  minReviewsForAverage: 5,
  emptyStateMode: "message",
  eligibilityRule: "days_registered",
  minRegistrationDays: 7,
};

export async function getHomepageCommunityReviewsSettings(): Promise<HomepageCommunityReviewsSettings> {
  const row = await prisma.homepageCommunityReviewsSettings.findUnique({
    where: { id: "default" },
  });

  if (!row) {
    return DEFAULTS;
  }

  return {
    memberCountDisplay: row.memberCountDisplay,
    showAverageRating: row.showAverageRating,
    minReviewsForAverage: row.minReviewsForAverage,
    emptyStateMode: row.emptyStateMode,
    eligibilityRule: row.eligibilityRule,
    minRegistrationDays: row.minRegistrationDays,
  };
}

export async function updateHomepageCommunityReviewsSettings(
  input: Partial<HomepageCommunityReviewsSettings>,
): Promise<HomepageCommunityReviewsSettings> {
  const row = await prisma.homepageCommunityReviewsSettings.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      ...DEFAULTS,
      ...input,
    },
    update: input,
  });

  return {
    memberCountDisplay: row.memberCountDisplay,
    showAverageRating: row.showAverageRating,
    minReviewsForAverage: row.minReviewsForAverage,
    emptyStateMode: row.emptyStateMode,
    eligibilityRule: row.eligibilityRule,
    minRegistrationDays: row.minRegistrationDays,
  };
}
