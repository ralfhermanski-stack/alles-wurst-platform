import { getCourseBySlug } from "@/lib/courses/course-catalog-service";
import { jsonFromCourseResult } from "@/lib/courses/course-api-utils";
import { hasActiveCourseAccess } from "@/lib/courses/course-access-service";
import { getCourseProgress } from "@/lib/courses/course-progress-service";
import { getSessionUserIdFromRequest } from "@/lib/auth/session";
import { getCourseForumsForUser } from "@/lib/forums/forum-service";
import {
  canUserReviewCourse,
  getUserCourseReview,
} from "@/lib/reviews/course-review-service";

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  try {
    const { slug } = await context.params;
    const result = await getCourseBySlug(slug);

    if (!result.success || !result.data) {
      return jsonFromCourseResult(result);
    }

    const userId = await getSessionUserIdFromRequest(request);
    let hasAccess = false;
    let progress = null;
    let forums = null;
    let canReview = false;
    let userReview = null;

    if (userId) {
      hasAccess = await hasActiveCourseAccess(userId, result.data.id);
      progress = hasAccess
        ? await getCourseProgress(userId, result.data.id)
        : null;

      if (hasAccess) {
        [forums, canReview, userReview] = await Promise.all([
          getCourseForumsForUser(result.data.id, userId),
          canUserReviewCourse(userId, result.data.id),
          getUserCourseReview(userId, result.data.id),
        ]);
      }
    }

    return jsonFromCourseResult({
      success: true,
      data: {
        course: result.data,
        hasAccess,
        progress,
        forums,
        canReview,
        userReview,
      },
    });
  } catch (error) {
    console.error("[api/courses/[slug]]", error);

    return jsonFromCourseResult({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Kurs konnte nicht geladen werden.",
      },
    });
  }
}
