/**
 * @file platform-review-types.ts
 */

import type {
  PlatformReviewFocus,
  PlatformReviewModerationStatus,
} from "@prisma/client";

export type UserPlatformReviewEntry = {
  id: string;
  rating: number;
  title: string | null;
  content: string;
  focus: PlatformReviewFocus;
  moderationStatus: PlatformReviewModerationStatus;
  publicConsent: boolean;
  showMembership: boolean;
  rejectionReason: string | null;
  submittedAt: string;
  updatedAt: string;
};

export type SubmitPlatformReviewInput = {
  rating: number;
  title?: string | null;
  content: string;
  focus?: PlatformReviewFocus;
  publicConsent: boolean;
  showMembership?: boolean;
};

export type AdminPlatformReviewEntry = UserPlatformReviewEntry & {
  userEmail: string;
  displayNameSnapshot: string | null;
  featuredOnHomepage: boolean;
};
