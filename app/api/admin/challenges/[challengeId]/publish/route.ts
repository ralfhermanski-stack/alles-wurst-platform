import { assertAdminAccessFromRequest } from "@/lib/admin/admin-auth";
import { jsonFromAuthResult } from "@/lib/auth/auth-api-utils";
import { publishChallenge } from "@/lib/challenges/challenge-service";

type RouteContext = {
  params: Promise<{ challengeId: string }>;
};

export async function POST(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const access = await assertAdminAccessFromRequest(request);

  if (!access.success) {
    return jsonFromAuthResult(access);
  }

  const { challengeId } = await context.params;
  const result = await publishChallenge(challengeId, access.data.userId);

  return jsonFromAuthResult(result);
}
