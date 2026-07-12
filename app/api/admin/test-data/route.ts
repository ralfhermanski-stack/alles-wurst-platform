import { adminGuardResponse } from "@/lib/admin/admin-api-utils";
import { assertAdminAccessFromRequest } from "@/lib/admin/admin-auth";
import { jsonFromAuthResult } from "@/lib/auth/auth-api-utils";
import {
  createTestChallenge,
  createTestSubmissions,
  deleteAllChallengeTestData,
  deleteAllSocialTestData,
  listTestDataSummary,
} from "@/lib/challenges/challenge-test-data-service";

export async function GET(request: Request): Promise<Response> {
  const denied = await adminGuardResponse(request);

  if (denied) {
    return denied;
  }

  const summary = await listTestDataSummary();

  return jsonFromAuthResult({ success: true, data: summary });
}

export async function POST(request: Request): Promise<Response> {
  const denied = await adminGuardResponse(request);

  if (denied) {
    return denied;
  }

  const access = await assertAdminAccessFromRequest(request);

  if (!access.success) {
    return jsonFromAuthResult(access);
  }

  const body = (await request.json()) as Record<string, unknown>;
  const action = typeof body.action === "string" ? body.action : "";

  switch (action) {
    case "create_test_challenge": {
      const result = await createTestChallenge(access.data.userId);
      return jsonFromAuthResult(result);
    }
    case "delete_challenge_test_data": {
      const result = await deleteAllChallengeTestData();
      return jsonFromAuthResult(result);
    }
    case "delete_social_test_data": {
      const result = await deleteAllSocialTestData();
      return jsonFromAuthResult(result);
    }
    case "create_test_submissions": {
      const challengeId =
        typeof body.challengeId === "string" ? body.challengeId : "";
      const userIds = Array.isArray(body.userIds)
        ? body.userIds.filter((id): id is string => typeof id === "string")
        : [];

      if (!challengeId || userIds.length === 0) {
        return jsonFromAuthResult({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Challenge-ID und Benutzer-IDs sind erforderlich.",
          },
        });
      }

      const result = await createTestSubmissions(challengeId, userIds);
      return jsonFromAuthResult(result);
    }
    default:
      return jsonFromAuthResult({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Unbekannte Aktion.",
        },
      });
  }
}
