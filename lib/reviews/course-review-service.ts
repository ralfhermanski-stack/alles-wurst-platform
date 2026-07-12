/**
 * @file course-review-service.ts
 * @purpose Kursbewertungen: Einreichen, Moderation, öffentliche Anzeige.
 */

import type { CourseReview, Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { findUserById } from "@/lib/users/user-service";
import {
  userFailure,
  userSuccess,
  type UserServiceResult,
} from "@/lib/users/user-errors";
import { hasActiveCourseAccess } from "@/lib/courses/course-access-service";
import { getCourseProgress } from "@/lib/courses/course-progress-service";
import { getPublicUserName } from "@/lib/users/public-user";
import {
  buildPublicAvatarUrl,
} from "@/lib/users/user-avatar-storage";

import type {
  AdminCourseReviewEntry,
  CourseReviewSummary,
  PublicCourseReviewEntry,
  SubmitCourseReviewInput,
  UserCourseReviewEntry,
} from "./course-review-types";

function toPublicReview(review: CourseReview): PublicCourseReviewEntry {
  return {
    id: review.id,
    rating: review.rating,
    reviewText: review.reviewText,
    displayName: review.displayNameSnapshot ?? "Wurstfreund",
    avatarUrl: review.avatarUrlSnapshot,
    createdAt: review.createdAt.toISOString(),
  };
}

function toUserReview(review: CourseReview): UserCourseReviewEntry {
  return {
    id: review.id,
    courseId: review.courseId,
    rating: review.rating,
    reviewText: review.reviewText,
    status: review.status,
    createdAt: review.createdAt.toISOString(),
    updatedAt: review.updatedAt.toISOString(),
  };
}

export async function canUserReviewCourse(
  userId: string,
  courseId: string,
): Promise<boolean> {
  const hasAccess = await hasActiveCourseAccess(userId, courseId);

  if (!hasAccess) {
    return false;
  }

  const progress = await getCourseProgress(userId, courseId);

  return progress.courseCompleted;
}

export async function getUserCourseReview(
  userId: string,
  courseId: string,
): Promise<UserCourseReviewEntry | null> {
  const review = await prisma.courseReview.findUnique({
    where: {
      courseId_userId: {
        courseId,
        userId,
      },
    },
  });

  return review ? toUserReview(review) : null;
}

export async function submitCourseReview(
  userId: string,
  courseId: string,
  input: SubmitCourseReviewInput,
): Promise<UserServiceResult<UserCourseReviewEntry>> {
  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
    return userFailure({
      code: "VALIDATION_ERROR",
      message: "Bewertung muss zwischen 1 und 5 Sternen liegen.",
    });
  }

  const canReview = await canUserReviewCourse(userId, courseId);

  if (!canReview) {
    return userFailure({
      code: "FORBIDDEN",
      message:
        "Bewertung ist erst nach Kursabschluss und mit aktivem Kurszugriff möglich.",
    });
  }

  const userResult = await findUserById(userId);

  if (!userResult.success || !userResult.data) {
    return userFailure({
      code: "NOT_FOUND",
      message: "Nutzer wurde nicht gefunden.",
    });
  }

  const user = userResult.data;
  const displayNameSnapshot = getPublicUserName({ profile: user.profile });
  const avatarUrlSnapshot = user.profile?.avatarStorageKey
    ? buildPublicAvatarUrl(user.id)
    : user.profile?.avatarUrl ?? null;
  const reviewText = input.reviewText?.trim() || null;

  try {
    const review = await prisma.courseReview.upsert({
      where: {
        courseId_userId: {
          courseId,
          userId,
        },
      },
      create: {
        courseId,
        userId,
        rating: input.rating,
        reviewText,
        displayNameSnapshot,
        avatarUrlSnapshot,
        status: "pending",
      },
      update: {
        rating: input.rating,
        reviewText,
        displayNameSnapshot,
        avatarUrlSnapshot: avatarUrlSnapshot,
        status: "pending",
      },
    });

    return userSuccess(toUserReview(review));
  } catch {
    return userFailure({
      code: "INTERNAL_ERROR",
      message: "Bewertung konnte nicht gespeichert werden.",
    });
  }
}

export async function getPublicCourseReviewSummary(
  courseId: string,
  limit = 6,
): Promise<CourseReviewSummary> {
  const [approvedReviews, aggregate, pendingCount] = await Promise.all([
    prisma.courseReview.findMany({
      where: { courseId, status: "approved" },
      orderBy: [{ rating: "desc" }, { createdAt: "desc" }],
      take: limit > 0 ? limit : undefined,
    }),
    prisma.courseReview.aggregate({
      where: { courseId, status: "approved" },
      _avg: { rating: true },
      _count: { _all: true },
    }),
    prisma.courseReview.count({
      where: { courseId, status: "pending" },
    }),
  ]);

  const reviewCount = aggregate._count._all;

  return {
    averageRating:
      reviewCount > 0 && aggregate._avg.rating !== null
        ? Math.round(aggregate._avg.rating * 10) / 10
        : null,
    reviewCount,
    pendingCount,
    reviews: approvedReviews.map(toPublicReview),
  };
}

export async function getCourseReviewStatsForAdmin(
  courseId: string,
): Promise<CourseReviewSummary> {
  return getPublicCourseReviewSummary(courseId, 0);
}

type AdminReviewFilters = {
  courseId?: string;
  status?: "pending" | "approved" | "rejected";
};

export async function listAdminCourseReviews(
  filters: AdminReviewFilters = {},
): Promise<AdminCourseReviewEntry[]> {
  const where: Prisma.CourseReviewWhereInput = {};

  if (filters.courseId) {
    where.courseId = filters.courseId;
  }

  if (filters.status) {
    where.status = filters.status;
  }

  const reviews = await prisma.courseReview.findMany({
    where,
    include: {
      course: { select: { title: true, slug: true } },
      user: { select: { email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return reviews.map((review) => ({
    ...toUserReview(review),
    courseTitle: review.course.title,
    courseSlug: review.course.slug,
    userEmail: review.user.email,
    displayNameSnapshot: review.displayNameSnapshot,
  }));
}

export async function moderateCourseReview(
  reviewId: string,
  status: "approved" | "rejected",
  moderatorId?: string,
  rejectionReason?: string | null,
): Promise<UserServiceResult<AdminCourseReviewEntry>> {
  const now = new Date();

  try {
    const review = await prisma.courseReview.update({
      where: { id: reviewId },
      data: {
        status,
        reviewedAt: now,
        reviewedById: moderatorId ?? null,
        rejectionReason: status === "rejected" ? rejectionReason ?? null : null,
        publishedAt: status === "approved" ? now : null,
        featuredOnHomepage: status === "approved" ? undefined : false,
      },
      include: {
        course: { select: { title: true, slug: true } },
        user: { select: { email: true } },
      },
    });

    return userSuccess({
      ...toUserReview(review),
      courseTitle: review.course.title,
      courseSlug: review.course.slug,
      userEmail: review.user.email,
      displayNameSnapshot: review.displayNameSnapshot,
    });
  } catch {
    return userFailure({
      code: "INTERNAL_ERROR",
      message: "Bewertung konnte nicht aktualisiert werden.",
    });
  }
}

export async function deleteCourseReview(
  reviewId: string,
): Promise<UserServiceResult<true>> {
  try {
    await prisma.courseReview.delete({ where: { id: reviewId } });

    return userSuccess(true);
  } catch {
    return userFailure({
      code: "INTERNAL_ERROR",
      message: "Bewertung konnte nicht gelöscht werden.",
    });
  }
}
