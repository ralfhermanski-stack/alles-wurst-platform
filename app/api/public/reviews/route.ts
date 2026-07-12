import { jsonFromCourseResult } from "@/lib/courses/course-api-utils";
import { getPublicHomepageReviews } from "@/lib/reviews/public-review-service";

export async function GET(): Promise<Response> {
  const payload = await getPublicHomepageReviews();

  return jsonFromCourseResult({ success: true, data: payload });
}
