import { adminGuardResponse } from "@/lib/admin/admin-api-utils";
import { jsonFromCourseResult } from "@/lib/courses/course-api-utils";
import {
  listUnifiedAdminReviews,
  type UnifiedReviewFilters,
  type UnifiedReviewSource,
} from "@/lib/reviews/unified-review-admin-service";

export async function GET(request: Request): Promise<Response> {
  const denied = await adminGuardResponse(request);

  if (denied) {
    return denied;
  }

  const url = new URL(request.url);
  const sourceParam = url.searchParams.get("source");
  const source: UnifiedReviewFilters["source"] =
    sourceParam === "course" || sourceParam === "platform"
      ? sourceParam
      : "all";

  const status = url.searchParams.get("status") ?? undefined;
  const featuredParam = url.searchParams.get("featured");
  const featured =
    featuredParam === "true"
      ? true
      : featuredParam === "false"
        ? false
        : undefined;
  const ratingParam = url.searchParams.get("rating");
  const rating = ratingParam ? Number(ratingParam) : undefined;
  const courseId = url.searchParams.get("courseId") ?? undefined;

  const reviews = await listUnifiedAdminReviews({
    source,
    status,
    featured,
    rating: Number.isFinite(rating) ? rating : undefined,
    courseId,
  });

  return jsonFromCourseResult({ success: true, data: reviews });
}
