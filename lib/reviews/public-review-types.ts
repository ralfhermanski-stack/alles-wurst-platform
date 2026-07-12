/**
 * @file public-review-types.ts
 */

export type PublicReviewSource = "course" | "platform";

export type PublicReviewFocus =
  | "platform"
  | "courses"
  | "recipes"
  | "tools"
  | "community"
  | "support";

export type PublicReviewEntry = {
  id: string;
  source: PublicReviewSource;
  rating: number;
  title: string | null;
  content: string;
  displayName: string;
  avatarUrl: string | null;
  membershipLabel: string | null;
  focus: PublicReviewFocus | "course";
  courseTitle: string | null;
  featuredOnHomepage: boolean;
  publishedAt: string;
};

export type PublicReviewStats = {
  reviewCount: number;
  averageRating: number | null;
  memberCount: number | null;
  memberCountDisplay: "exact" | "rounded" | "hidden";
  showAverageRating: boolean;
  minReviewsForAverage: number;
};

export type HomepageReviewsPayload = {
  reviews: PublicReviewEntry[];
  stats: PublicReviewStats;
  emptyStateMode: "message" | "hidden";
};
