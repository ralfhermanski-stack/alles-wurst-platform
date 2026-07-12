import { requestEmailVerification } from "@/lib/auth/email-verification-service";
import {
  getStringField,
  jsonFromAuthResult,
  parseJsonBody,
} from "@/lib/auth/auth-api-utils";
import { getSessionUserIdFromRequest } from "@/lib/auth/session";
import { userFailure } from "@/lib/users/user-errors";

/**
 * POST /api/auth/verify-email/request — Bestätigungslink anfordern.
 */
export async function POST(request: Request): Promise<Response> {
  const sessionUserId = await getSessionUserIdFromRequest(request);
  const body = await parseJsonBody(request);
  const email = body ? getStringField(body, "email") : null;

  if (!sessionUserId && !email) {
    return jsonFromAuthResult(
      userFailure({
        code: "VALIDATION_ERROR",
        message: "E-Mail-Adresse ist erforderlich.",
      }),
    );
  }

  const result = await requestEmailVerification({
    userId: sessionUserId ?? undefined,
    email: email ?? undefined,
  });

  return jsonFromAuthResult(result);
}
