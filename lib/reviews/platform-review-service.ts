/**
 * @file platform-review-service.ts
 * @purpose Plattformbewertungen: Erstellen, Bearbeiten, Zurückziehen, Moderation.
 */

import type { PlatformReview, PlatformReviewFocus, Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { MEMBERSHIP_ROLE_LABELS } from "@/lib/membership/membership-labels";
import { resolveAppRoleFromMembership } from "@/lib/users/membership-mappers";
import { findUserById } from "@/lib/users/user-service";
import { getPublicUserName } from "@/lib/users/public-user";
import { buildPublicAvatarUrl } from "@/lib/users/user-avatar-storage";
import {
  userFailure,
  userSuccess,
  type UserServiceResult,
} from "@/lib/users/user-errors";

import { canUserSubmitPlatformReview } from "./platform-review-eligibility";
import {
  sanitizePlatformReviewContent,
  sanitizePlatformReviewTitle,
  validatePlatformReviewContent,
} from "./platform-review-sanitize";
import type {
  AdminPlatformReviewEntry,
  SubmitPlatformReviewInput,
  UserPlatformReviewEntry,
} from "./platform-review-types";

const VALID_FOCUS: PlatformReviewFocus[] = [
  "platform",
  "courses",
  "recipes",
  "tools",
  "community",
  "support",
];

const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_MS = 60_000;

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const last = rateLimitMap.get(userId);

  if (last && now - last < RATE_LIMIT_MS) {
    return false;
  }

  rateLimitMap.set(userId, now);
  return true;
}

function toUserEntry(review: PlatformReview): UserPlatformReviewEntry {
  return {
    id: review.id,
    rating: review.rating,
    title: review.title,
    content: review.content,
    focus: review.focus,
    moderationStatus: review.moderationStatus,
    publicConsent: review.publicConsent,
    showMembership: review.showMembership,
    rejectionReason: review.rejectionReason,
    submittedAt: review.submittedAt.toISOString(),
    updatedAt: review.updatedAt.toISOString(),
  };
}

async function buildSnapshots(
  userId: string,
  showMembership: boolean,
): Promise<{
  displayNameSnapshot: string;
  avatarUrlSnapshot: string | null;
  membershipLabelSnapshot: string | null;
}> {
  const userResult = await findUserById(userId);

  if (!userResult.success || !userResult.data) {
    return {
      displayNameSnapshot: "Wurstfreund",
      avatarUrlSnapshot: null,
      membershipLabelSnapshot: null,
    };
  }

  const user = userResult.data;
  const displayNameSnapshot = getPublicUserName({ profile: user.profile });
  const avatarUrlSnapshot = user.profile?.avatarStorageKey
    ? buildPublicAvatarUrl(user.id)
    : user.profile?.avatarUrl ?? null;

  let membershipLabelSnapshot: string | null = null;

  if (showMembership) {
    const membership = await prisma.membership.findUnique({
      where: { userId },
    });
    const role = resolveAppRoleFromMembership(membership);
    membershipLabelSnapshot = MEMBERSHIP_ROLE_LABELS[role];
  }

  return { displayNameSnapshot, avatarUrlSnapshot, membershipLabelSnapshot };
}

export async function getUserPlatformReview(
  userId: string,
): Promise<UserPlatformReviewEntry | null> {
  const review = await prisma.platformReview.findUnique({
    where: { userId },
  });

  if (!review || review.moderationStatus === "archived") {
    return null;
  }

  return toUserEntry(review);
}

export async function submitPlatformReview(
  userId: string,
  input: SubmitPlatformReviewInput,
): Promise<UserServiceResult<UserPlatformReviewEntry>> {
  if (!checkRateLimit(userId)) {
    return userFailure({
      code: "VALIDATION_ERROR",
      message: "Bitte warte einen Moment, bevor du erneut speicherst.",
    });
  }

  const eligibility = await canUserSubmitPlatformReview(userId);

  if (!eligibility.allowed) {
    return userFailure({
      code: "FORBIDDEN",
      message: eligibility.reason ?? "Bewertung nicht erlaubt.",
    });
  }

  if (!input.publicConsent) {
    return userFailure({
      code: "VALIDATION_ERROR",
      message: "Bitte stimme der Veröffentlichung zu.",
    });
  }

  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
    return userFailure({
      code: "VALIDATION_ERROR",
      message: "Bewertung muss zwischen 1 und 5 Sternen liegen.",
    });
  }

  const contentError = validatePlatformReviewContent(input.content);

  if (contentError) {
    return userFailure({
      code: "VALIDATION_ERROR",
      message: contentError,
    });
  }

  const focus =
    input.focus && VALID_FOCUS.includes(input.focus) ? input.focus : "platform";

  const title = input.title ? sanitizePlatformReviewTitle(input.title) : null;
  const content = sanitizePlatformReviewContent(input.content);
  const showMembership = input.showMembership ?? false;

  const snapshots = await buildSnapshots(userId, showMembership);

  try {
    const review = await prisma.platformReview.upsert({
      where: { userId },
      create: {
        userId,
        rating: input.rating,
        title: title || null,
        content,
        focus,
        publicConsent: true,
        showMembership,
        moderationStatus: "pending",
        featuredOnHomepage: false,
        ...snapshots,
        submittedAt: new Date(),
      },
      update: {
        rating: input.rating,
        title: title || null,
        content,
        focus,
        publicConsent: true,
        showMembership,
        moderationStatus: "pending",
        rejectionReason: null,
        reviewedAt: null,
        reviewedById: null,
        publishedAt: null,
        ...snapshots,
        submittedAt: new Date(),
      },
    });

    return userSuccess(toUserEntry(review));
  } catch {
    return userFailure({
      code: "INTERNAL_ERROR",
      message: "Bewertung konnte nicht gespeichert werden.",
    });
  }
}

export async function withdrawPlatformReview(
  userId: string,
): Promise<UserServiceResult<true>> {
  try {
    await prisma.platformReview.update({
      where: { userId },
      data: {
        moderationStatus: "archived",
        publicConsent: false,
        featuredOnHomepage: false,
      },
    });

    return userSuccess(true);
  } catch {
    return userFailure({
      code: "NOT_FOUND",
      message: "Keine aktive Bewertung gefunden.",
    });
  }
}

export async function listAdminPlatformReviews(filters: {
  status?: PlatformReview["moderationStatus"];
  featured?: boolean;
  rating?: number;
} = {}): Promise<AdminPlatformReviewEntry[]> {
  const where: Prisma.PlatformReviewWhereInput = {};

  if (filters.status) {
    where.moderationStatus = filters.status;
  }

  if (filters.featured !== undefined) {
    where.featuredOnHomepage = filters.featured;
  }

  if (filters.rating !== undefined) {
    where.rating = filters.rating;
  }

  const reviews = await prisma.platformReview.findMany({
    where,
    include: {
      user: { select: { email: true } },
    },
    orderBy: { submittedAt: "desc" },
  });

  return reviews.map((review) => ({
    ...toUserEntry(review),
    userEmail: review.user.email,
    displayNameSnapshot: review.displayNameSnapshot,
    featuredOnHomepage: review.featuredOnHomepage,
  }));
}

export async function moderatePlatformReview(
  reviewId: string,
  status: "approved" | "rejected" | "archived",
  moderatorId: string,
  rejectionReason?: string | null,
): Promise<UserServiceResult<AdminPlatformReviewEntry>> {
  const now = new Date();

  try {
    const review = await prisma.platformReview.update({
      where: { id: reviewId },
      data: {
        moderationStatus: status,
        reviewedAt: now,
        reviewedById: moderatorId,
        rejectionReason: status === "rejected" ? rejectionReason ?? null : null,
        publishedAt: status === "approved" ? now : null,
        featuredOnHomepage: status === "approved" ? undefined : false,
      },
      include: {
        user: { select: { email: true } },
      },
    });

    return userSuccess({
      ...toUserEntry(review),
      userEmail: review.user.email,
      displayNameSnapshot: review.displayNameSnapshot,
      featuredOnHomepage: review.featuredOnHomepage,
    });
  } catch {
    return userFailure({
      code: "INTERNAL_ERROR",
      message: "Bewertung konnte nicht aktualisiert werden.",
    });
  }
}

export async function setPlatformReviewFeatured(
  reviewId: string,
  featured: boolean,
): Promise<UserServiceResult<AdminPlatformReviewEntry>> {
  try {
    const review = await prisma.platformReview.update({
      where: { id: reviewId },
      data: { featuredOnHomepage: featured },
      include: {
        user: { select: { email: true } },
      },
    });

    return userSuccess({
      ...toUserEntry(review),
      userEmail: review.user.email,
      displayNameSnapshot: review.displayNameSnapshot,
      featuredOnHomepage: review.featuredOnHomepage,
    });
  } catch {
    return userFailure({
      code: "INTERNAL_ERROR",
      message: "Hervorhebung konnte nicht gespeichert werden.",
    });
  }
}
