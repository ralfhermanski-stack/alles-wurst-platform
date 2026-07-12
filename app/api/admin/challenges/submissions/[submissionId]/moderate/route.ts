import { assertAdminAccessFromRequest } from "@/lib/admin/admin-auth";
import { jsonFromAuthResult } from "@/lib/auth/auth-api-utils";
import { moderateSubmissionByStatus } from "@/lib/challenges/challenge-submission-service";
import type { ChallengeSubmissionStatus } from "@prisma/client";

type RouteContext = {
  params: Promise<{ submissionId: string }>;
};

export async function POST(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const access = await assertAdminAccessFromRequest(request);

  if (!access.success) {
    return jsonFromAuthResult(access);
  }

  const { submissionId } = await context.params;
  const body = (await request.json()) as Record<string, unknown>;
  const status = body.status as ChallengeSubmissionStatus | undefined;

  if (
    !status ||
    ![
      "APPROVED",
      "REJECTED",
      "UNDER_REVIEW",
      "WINNER",
    ].includes(status)
  ) {
    return jsonFromAuthResult({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Gültiger Moderationsstatus ist erforderlich.",
      },
    });
  }

  const result = await moderateSubmissionByStatus(
    access.data.userId,
    submissionId,
    status,
    typeof body.rejectionReason === "string" ? body.rejectionReason : null,
  );

  return jsonFromAuthResult(result);
}
