import { adminGuardResponse } from "@/lib/admin/admin-api-utils";
import { jsonFromAuthResult } from "@/lib/auth/auth-api-utils";
import { listAdminChallengeSubmissions } from "@/lib/challenges/challenge-submission-service";
import type { ChallengeSubmissionStatus } from "@prisma/client";

type RouteContext = {
  params: Promise<{ challengeId: string }>;
};

export async function GET(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const denied = await adminGuardResponse(request);

  if (denied) {
    return denied;
  }

  const { challengeId } = await context.params;
  const url = new URL(request.url);
  const status = url.searchParams.get("status") as
    | ChallengeSubmissionStatus
    | "all"
    | null;

  const result = await listAdminChallengeSubmissions(challengeId, {
    status: status ?? "all",
  });

  return jsonFromAuthResult(result);
}
