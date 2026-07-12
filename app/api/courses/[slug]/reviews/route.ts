import { getSessionUserIdFromRequest } from "@/lib/auth/session";
import { getCourseBySlug } from "@/lib/courses/course-catalog-service";
import { jsonFromCourseResult } from "@/lib/courses/course-api-utils";
import {
  canUserReviewCourse,
  getUserCourseReview,
  submitCourseReview,
} from "@/lib/reviews/course-review-service";

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const { slug } = await context.params;
  const courseResult = await getCourseBySlug(slug);

  if (!courseResult.success || !courseResult.data) {
    return jsonFromCourseResult(courseResult);
  }

  const userId = await getSessionUserIdFromRequest(request);

  if (!userId) {
    return jsonFromCourseResult({
      success: false,
      error: { code: "FORBIDDEN", message: "Anmeldung erforderlich." },
    });
  }

  const [canReview, review] = await Promise.all([
    canUserReviewCourse(userId, courseResult.data.id),
    getUserCourseReview(userId, courseResult.data.id),
  ]);

  return jsonFromCourseResult({
    success: true,
    data: { canReview, review },
  });
}

export async function POST(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const { slug } = await context.params;
  const courseResult = await getCourseBySlug(slug);

  if (!courseResult.success || !courseResult.data) {
    return jsonFromCourseResult(courseResult);
  }

  const userId = await getSessionUserIdFromRequest(request);

  if (!userId) {
    return jsonFromCourseResult({
      success: false,
      error: { code: "FORBIDDEN", message: "Anmeldung erforderlich." },
    });
  }

  const body = (await request.json()) as {
    rating?: number;
    reviewText?: string | null;
  };

  const result = await submitCourseReview(userId, courseResult.data.id, {
    rating: Number(body.rating),
    reviewText: body.reviewText,
  });

  return jsonFromCourseResult(result);
}
