/**
 * @file unified-review-admin-service.ts
 * @purpose Admin-Moderation für Kurs- und Plattformbewertungen.
 */

import type { CourseReviewStatus, PlatformReviewModerationStatus } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import {
  userFailure,
  userSuccess,
  type UserServiceResult,
} from "@/lib/users/user-errors";

import {
  listAdminCourseReviews,
  moderateCourseReview,
} from "./course-review-service";
import {
  listAdminPlatformReviews,
  moderatePlatformReview,
  setPlatformReviewFeatured,
} from "./platform-review-service";

export type UnifiedReviewSource = "course" | "platform";

export type UnifiedAdminReviewEntry = {
  id: string;
  source: UnifiedReviewSource;
  rating: number;
  title: string | null;
  content: string;
  status: CourseReviewStatus | PlatformReviewModerationStatus;
  displayName: string | null;
  userEmail: string;
  contextLabel: string;
  featuredOnHomepage: boolean;
  rejectionReason: string | null;
  createdAt: string;
};

export type UnifiedReviewFilters = {
  source?: UnifiedReviewSource | "all";
  status?: string;
  featured?: boolean;
  rating?: number;
  courseId?: string;
};

function mapCourseStatus(
  status: CourseReviewStatus,
): UnifiedAdminReviewEntry["status"] {
  return status;
}

export async function listUnifiedAdminReviews(
  filters: UnifiedReviewFilters = {},
): Promise<UnifiedAdminReviewEntry[]> {
  const source = filters.source ?? "all";
  const entries: UnifiedAdminReviewEntry[] = [];

  if (source === "all" || source === "course") {
    const courseStatus =
      filters.status === "pending" ||
      filters.status === "approved" ||
      filters.status === "rejected"
        ? filters.status
        : undefined;

    const courseReviews = await listAdminCourseReviews({
      courseId: filters.courseId,
      status: courseStatus,
    });

    for (const review of courseReviews) {
      if (filters.rating !== undefined && review.rating !== filters.rating) {
        continue;
      }

      if (filters.featured !== undefined) {
        const row = await prisma.courseReview.findUnique({
          where: { id: review.id },
          select: { featuredOnHomepage: true },
        });

        if (!row || row.featuredOnHomepage !== filters.featured) {
          continue;
        }
      }

      entries.push({
        id: review.id,
        source: "course",
        rating: review.rating,
        title: null,
        content: review.reviewText ?? "",
        status: mapCourseStatus(review.status),
        displayName: review.displayNameSnapshot,
        userEmail: review.userEmail,
        contextLabel: review.courseTitle,
        featuredOnHomepage: false,
        rejectionReason: null,
        createdAt: review.createdAt,
      });
    }

    if (source === "course") {
      const ids = entries.map((entry) => entry.id);
      const featuredRows = await prisma.courseReview.findMany({
        where: { id: { in: ids } },
        select: { id: true, featuredOnHomepage: true, rejectionReason: true },
      });
      const featuredMap = new Map(
        featuredRows.map((row) => [row.id, row]),
      );

      return entries.map((entry) => ({
        ...entry,
        featuredOnHomepage:
          featuredMap.get(entry.id)?.featuredOnHomepage ?? false,
        rejectionReason: featuredMap.get(entry.id)?.rejectionReason ?? null,
      }));
    }
  }

  if (source === "all" || source === "platform") {
    const platformStatus =
      filters.status === "pending" ||
      filters.status === "approved" ||
      filters.status === "rejected" ||
      filters.status === "archived"
        ? filters.status
        : undefined;

    const platformReviews = await listAdminPlatformReviews({
      status: platformStatus,
      featured: filters.featured,
      rating: filters.rating,
    });

    for (const review of platformReviews) {
      entries.push({
        id: review.id,
        source: "platform",
        rating: review.rating,
        title: review.title,
        content: review.content,
        status: review.moderationStatus,
        displayName: review.displayNameSnapshot,
        userEmail: review.userEmail,
        contextLabel: `Plattform · ${review.focus}`,
        featuredOnHomepage: review.featuredOnHomepage,
        rejectionReason: review.rejectionReason,
        createdAt: review.submittedAt,
      });
    }
  }

  if (source === "all") {
    const courseIds = entries
      .filter((entry) => entry.source === "course")
      .map((entry) => entry.id);

    if (courseIds.length > 0) {
      const featuredRows = await prisma.courseReview.findMany({
        where: { id: { in: courseIds } },
        select: { id: true, featuredOnHomepage: true, rejectionReason: true },
      });
      const featuredMap = new Map(
        featuredRows.map((row) => [row.id, row]),
      );

      for (const entry of entries) {
        if (entry.source !== "course") {
          continue;
        }

        const row = featuredMap.get(entry.id);

        if (row) {
          entry.featuredOnHomepage = row.featuredOnHomepage;
          entry.rejectionReason = row.rejectionReason;
        }
      }
    }
  }

  return entries.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export async function moderateUnifiedReview(
  source: UnifiedReviewSource,
  reviewId: string,
  status: "approved" | "rejected" | "archived",
  moderatorId: string,
  rejectionReason?: string | null,
): Promise<UserServiceResult<UnifiedAdminReviewEntry>> {
  if (source === "course") {
    if (status === "archived") {
      await prisma.courseReview.update({
        where: { id: reviewId },
        data: {
          status: "rejected",
          featuredOnHomepage: false,
        },
      });
    } else {
      const result = await moderateCourseReview(reviewId, status, moderatorId);

      if (!result.success) {
        return result as UserServiceResult<UnifiedAdminReviewEntry>;
      }
    }

    const reviews = await listUnifiedAdminReviews({
      source: "course",
    });

    const entry = reviews.find((row) => row.id === reviewId);

    if (!entry) {
      return userFailure({
        code: "NOT_FOUND",
        message: "Bewertung nicht gefunden.",
      });
    }

    return userSuccess(entry);
  }

  const result = await moderatePlatformReview(
    reviewId,
    status,
    moderatorId,
    rejectionReason,
  );

  if (!result.success) {
    return result as UserServiceResult<UnifiedAdminReviewEntry>;
  }

  return userSuccess({
    id: result.data.id,
    source: "platform",
    rating: result.data.rating,
    title: result.data.title,
    content: result.data.content,
    status: result.data.moderationStatus,
    displayName: result.data.displayNameSnapshot,
    userEmail: result.data.userEmail,
    contextLabel: `Plattform · ${result.data.focus}`,
    featuredOnHomepage: result.data.featuredOnHomepage,
    rejectionReason: result.data.rejectionReason,
    createdAt: result.data.submittedAt,
  });
}

export async function setUnifiedReviewFeatured(
  source: UnifiedReviewSource,
  reviewId: string,
  featured: boolean,
): Promise<UserServiceResult<true>> {
  if (source === "course") {
    try {
      await prisma.courseReview.update({
        where: { id: reviewId },
        data: { featuredOnHomepage: featured },
      });

      return userSuccess(true);
    } catch {
      return userFailure({
        code: "INTERNAL_ERROR",
        message: "Hervorhebung konnte nicht gespeichert werden.",
      });
    }
  }

  const result = await setPlatformReviewFeatured(reviewId, featured);

  if (!result.success) {
    return result as UserServiceResult<true>;
  }

  return userSuccess(true);
}
