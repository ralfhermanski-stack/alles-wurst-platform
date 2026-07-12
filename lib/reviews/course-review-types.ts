/**
 * @file course-review-types.ts
 * @purpose Typen für Kursbewertungen.
 */

import type { CourseReviewStatus } from "@prisma/client";

export type PublicCourseReviewEntry = {
  id: string;
  rating: number;
  reviewText: string | null;
  displayName: string;
  avatarUrl: string | null;
  createdAt: string;
};

export type CourseReviewSummary = {
  averageRating: number | null;
  reviewCount: number;
  pendingCount: number;
  reviews: PublicCourseReviewEntry[];
};

export type UserCourseReviewEntry = {
  id: string;
  courseId: string;
  rating: number;
  reviewText: string | null;
  status: CourseReviewStatus;
  createdAt: string;
  updatedAt: string;
};

export type AdminCourseReviewEntry = UserCourseReviewEntry & {
  courseTitle: string;
  courseSlug: string;
  userEmail: string;
  displayNameSnapshot: string | null;
};

export type SubmitCourseReviewInput = {
  rating: number;
  reviewText?: string | null;
};
