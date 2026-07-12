import { adminGuardResponse } from "@/lib/admin/admin-api-utils";
import { createAdminAuditLog } from "@/lib/admin/admin-audit";
import { getSessionUserIdFromRequest } from "@/lib/auth/session";
import { jsonFromCourseResult } from "@/lib/courses/course-api-utils";
import { deleteCourseReview } from "@/lib/reviews/course-review-service";
import {
  moderateUnifiedReview,
  type UnifiedReviewSource,
} from "@/lib/reviews/unified-review-admin-service";

type RouteContext = { params: Promise<{ reviewId: string }> };

function parseSource(value: unknown): UnifiedReviewSource | null {
  return value === "course" || value === "platform" ? value : null;
}

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
    status?: string;
    rejectionReason?: string | null;
  };

  const source = parseSource(body.source);

  if (!source) {
    return jsonFromCourseResult({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Quelle (course oder platform) ist erforderlich.",
      },
    });
  }

  const status = body.status;

  if (
    status !== "approved" &&
    status !== "rejected" &&
    status !== "archived"
  ) {
    return jsonFromCourseResult({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Status muss approved, rejected oder archived sein.",
      },
    });
  }

  const moderatorId = await getSessionUserIdFromRequest(request);

  if (!moderatorId) {
    return jsonFromCourseResult({
      success: false,
      error: {
        code: "FORBIDDEN",
        message: "Anmeldung erforderlich.",
      },
    });
  }

  const result = await moderateUnifiedReview(
    source,
    reviewId,
    status,
    moderatorId,
    body.rejectionReason,
  );

  if (result.success) {
    await createAdminAuditLog({
      targetUserId: moderatorId,
      actorUserId: moderatorId,
      action: "role_change",
      summary: `${source === "course" ? "Kurs" : "Plattform"}bewertung ${status}`,
      newValues: {
        reviewId,
        source,
        status,
      },
    });
  }

  return jsonFromCourseResult(result);
}

export async function DELETE(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const denied = await adminGuardResponse(request);

  if (denied) {
    return denied;
  }

  const { reviewId } = await context.params;
  const url = new URL(request.url);
  const source = parseSource(url.searchParams.get("source"));

  if (source !== "course") {
    return jsonFromCourseResult({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Löschen ist nur für Kursbewertungen verfügbar.",
      },
    });
  }

  const result = await deleteCourseReview(reviewId);

  return jsonFromCourseResult(result);
}
