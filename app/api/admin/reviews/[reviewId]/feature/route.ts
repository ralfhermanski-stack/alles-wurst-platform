import { adminGuardResponse } from "@/lib/admin/admin-api-utils";
import { createAdminAuditLog } from "@/lib/admin/admin-audit";
import { getSessionUserIdFromRequest } from "@/lib/auth/session";
import { jsonFromCourseResult } from "@/lib/courses/course-api-utils";
import {
  setUnifiedReviewFeatured,
  type UnifiedReviewSource,
} from "@/lib/reviews/unified-review-admin-service";

type RouteContext = { params: Promise<{ reviewId: string }> };

export async function PATCH(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const denied = await adminGuardResponse(request);

  if (denied) {
    return denied;
  }

  const { reviewId } = await context.params;
  const body = (await request.json()) as {
    source?: string;
    featured?: boolean;
  };

  const source: UnifiedReviewSource | null =
    body.source === "course" || body.source === "platform" ? body.source : null;

  if (!source) {
    return jsonFromCourseResult({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Quelle (course oder platform) ist erforderlich.",
      },
    });
  }

  if (typeof body.featured !== "boolean") {
    return jsonFromCourseResult({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "featured muss true oder false sein.",
      },
    });
  }

  const actorUserId = await getSessionUserIdFromRequest(request);

  if (!actorUserId) {
    return jsonFromCourseResult({
      success: false,
      error: {
        code: "FORBIDDEN",
        message: "Anmeldung erforderlich.",
      },
    });
  }

  const result = await setUnifiedReviewFeatured(
    source,
    reviewId,
    body.featured,
  );

  if (result.success) {
    await createAdminAuditLog({
      targetUserId: actorUserId,
      actorUserId,
      action: "role_change",
      summary: `Bewertung ${body.featured ? "hervorgehoben" : "Hervorhebung entfernt"}`,
      newValues: { reviewId, source, featured: body.featured },
    });
  }

  return jsonFromCourseResult(result);
}
