import { requestPasswordReset } from "@/lib/auth/password-reset-service";
import {
  getStringField,
  jsonFromAuthResult,
  parseJsonBody,
} from "@/lib/auth/auth-api-utils";
import { userFailure } from "@/lib/users/user-errors";
import { buildSecurityRequestContext } from "@/lib/security/request-context";
import { enforceSecurityGuard } from "@/lib/security/security-guard";
import { recordSecurityEvent } from "@/lib/security/security-event-service";

/**
 * POST /api/auth/password-reset/request — Passwort-Reset anfordern.
 */
export async function POST(request: Request): Promise<Response> {
  const guardResponse = await enforceSecurityGuard(request, {
    rateLimitScope: "password_reset",
  });

  if (guardResponse) {
    return guardResponse;
  }

  const context = buildSecurityRequestContext(request);
  const body = await parseJsonBody(request);
  const email = body ? getStringField(body, "email") : null;

  if (!email) {
    return jsonFromAuthResult(
      userFailure({
        code: "VALIDATION_ERROR",
        message: "E-Mail-Adresse ist erforderlich.",
      }),
    );
  }

  const result = await requestPasswordReset(email);

  await recordSecurityEvent({
    eventType: "PASSWORD_RESET_REQUEST",
    context,
    metadata: { email: email.trim().toLowerCase() },
  });

  return jsonFromAuthResult(result);
}
