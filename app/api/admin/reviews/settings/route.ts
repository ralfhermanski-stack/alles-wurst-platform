import { adminGuardResponse } from "@/lib/admin/admin-api-utils";
import { createAdminAuditLog } from "@/lib/admin/admin-audit";
import { getSessionUserIdFromRequest } from "@/lib/auth/session";
import { jsonFromCourseResult } from "@/lib/courses/course-api-utils";
import {
  getHomepageCommunityReviewsSettings,
  updateHomepageCommunityReviewsSettings,
} from "@/lib/reviews/homepage-reviews-settings-service";
import type {
  HomepageReviewsEmptyMode,
  MemberCountDisplayMode,
  PlatformReviewEligibilityRule,
} from "@prisma/client";

export async function GET(request: Request): Promise<Response> {
  const denied = await adminGuardResponse(request);

  if (denied) {
    return denied;
  }

  const settings = await getHomepageCommunityReviewsSettings();

  return jsonFromCourseResult({ success: true, data: settings });
}

export async function PATCH(request: Request): Promise<Response> {
  const denied = await adminGuardResponse(request);

  if (denied) {
    return denied;
  }

  const actorUserId = await getSessionUserIdFromRequest(request);
  const body = (await request.json()) as Record<string, unknown>;

  const input: Parameters<typeof updateHomepageCommunityReviewsSettings>[0] = {};

  if (
    body.memberCountDisplay === "exact" ||
    body.memberCountDisplay === "rounded" ||
    body.memberCountDisplay === "hidden"
  ) {
    input.memberCountDisplay = body.memberCountDisplay as MemberCountDisplayMode;
  }

  if (typeof body.showAverageRating === "boolean") {
    input.showAverageRating = body.showAverageRating;
  }

  if (typeof body.minReviewsForAverage === "number") {
    input.minReviewsForAverage = Math.max(1, Math.min(100, body.minReviewsForAverage));
  }

  if (body.emptyStateMode === "message" || body.emptyStateMode === "hidden") {
    input.emptyStateMode = body.emptyStateMode as HomepageReviewsEmptyMode;
  }

  if (
    body.eligibilityRule === "days_registered" ||
    body.eligibilityRule === "course_started" ||
    body.eligibilityRule === "recipe_saved" ||
    body.eligibilityRule === "tool_used"
  ) {
    input.eligibilityRule = body.eligibilityRule as PlatformReviewEligibilityRule;
  }

  if (typeof body.minRegistrationDays === "number") {
    input.minRegistrationDays = Math.max(1, Math.min(365, body.minRegistrationDays));
  }

  const previous = await getHomepageCommunityReviewsSettings();
  const settings = await updateHomepageCommunityReviewsSettings(input);

  if (actorUserId) {
    await createAdminAuditLog({
      targetUserId: actorUserId,
      actorUserId,
      action: "role_change",
      summary: "Startseiten-Bewertungseinstellungen geändert",
      previousValues: previous as unknown as Record<string, unknown>,
      newValues: settings as unknown as Record<string, unknown>,
    });
  }

  return jsonFromCourseResult({ success: true, data: settings });
}
