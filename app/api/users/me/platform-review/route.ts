import { getSessionUserIdFromRequest } from "@/lib/auth/session";
import {
  jsonFromAuthResult,
  parseJsonBody,
} from "@/lib/auth/auth-api-utils";
import { userFailure } from "@/lib/users/user-errors";
import { canUserSubmitPlatformReview } from "@/lib/reviews/platform-review-eligibility";
import {
  getUserPlatformReview,
  submitPlatformReview,
  withdrawPlatformReview,
} from "@/lib/reviews/platform-review-service";
import type { PlatformReviewFocus } from "@prisma/client";

const VALID_FOCUS = new Set<PlatformReviewFocus>([
  "platform",
  "courses",
  "recipes",
  "tools",
  "community",
  "support",
]);

export async function GET(request: Request): Promise<Response> {
  const userId = await getSessionUserIdFromRequest(request);

  if (!userId) {
    return jsonFromAuthResult(
      userFailure({
        code: "FORBIDDEN",
        message: "Anmeldung erforderlich.",
      }),
    );
  }

  const [review, eligibility] = await Promise.all([
    getUserPlatformReview(userId),
    canUserSubmitPlatformReview(userId),
  ]);

  return jsonFromAuthResult({
    success: true,
    data: {
      review,
      eligibility,
    },
  });
}

export async function POST(request: Request): Promise<Response> {
  const userId = await getSessionUserIdFromRequest(request);

  if (!userId) {
    return jsonFromAuthResult(
      userFailure({
        code: "FORBIDDEN",
        message: "Anmeldung erforderlich.",
      }),
    );
  }

  const body = await parseJsonBody(request);

  if (!body) {
    return jsonFromAuthResult(
      userFailure({
        code: "VALIDATION_ERROR",
        message: "Ungültiger JSON-Body.",
      }),
    );
  }

  const rating = Number(body.rating);
  const content = typeof body.content === "string" ? body.content : "";
  const title = typeof body.title === "string" ? body.title : null;
  const focus =
    typeof body.focus === "string" && VALID_FOCUS.has(body.focus as PlatformReviewFocus)
      ? (body.focus as PlatformReviewFocus)
      : undefined;
  const publicConsent = body.publicConsent === true;
  const showMembership = body.showMembership === true;

  const result = await submitPlatformReview(userId, {
    rating,
    title,
    content,
    focus,
    publicConsent,
    showMembership,
  });

  return jsonFromAuthResult(result);
}

export async function PATCH(request: Request): Promise<Response> {
  return POST(request);
}

export async function DELETE(request: Request): Promise<Response> {
  const userId = await getSessionUserIdFromRequest(request);

  if (!userId) {
    return jsonFromAuthResult(
      userFailure({
        code: "FORBIDDEN",
        message: "Anmeldung erforderlich.",
      }),
    );
  }

  const result = await withdrawPlatformReview(userId);

  return jsonFromAuthResult(result);
}
