import { confirmEmailVerification } from "@/lib/auth/email-verification-service";
import {
  getStringField,
  jsonAuthSuccess,
  jsonFromAuthResult,
  parseJsonBody,
} from "@/lib/auth/auth-api-utils";
import { getSessionUser } from "@/lib/auth/auth-service";
import { setSessionCookie } from "@/lib/auth/session";
import { userFailure } from "@/lib/users/user-errors";

/**
 * POST /api/auth/verify-email/confirm — E-Mail mit Token bestätigen.
 */
export async function POST(request: Request): Promise<Response> {
  const body = await parseJsonBody(request);
  const token = body ? getStringField(body, "token") : null;

  if (!token) {
    return jsonFromAuthResult(
      userFailure({
        code: "VALIDATION_ERROR",
        message: "Bestätigungslink ist ungültig.",
      }),
    );
  }

  const result = await confirmEmailVerification(token);

  if (!result.success) {
    return jsonFromAuthResult(result);
  }

  const sessionUser = await getSessionUser(result.data.userId);

  if (sessionUser.success && sessionUser.data) {
    await setSessionCookie(
      sessionUser.data.id,
      sessionUser.data.systemRole,
      sessionUser.data.maintenanceBypass,
      request,
    );
  } else {
    await setSessionCookie(result.data.userId, "USER", false, request);
  }

  return jsonAuthSuccess({
    message: result.data.message,
    userId: result.data.userId,
  });
}
