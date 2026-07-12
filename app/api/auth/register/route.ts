import { registerUser } from "@/lib/auth/auth-service";
import { requestEmailVerification } from "@/lib/auth/email-verification-service";
import {
  jsonAuthSuccess,
  jsonFromAuthResult,
  parseJsonBody,
} from "@/lib/auth/auth-api-utils";
import { parseRegisterBody } from "@/lib/auth/register-body";
import { setSessionCookie } from "@/lib/auth/session";
import { userFailure } from "@/lib/users/user-errors";
import { buildSecurityRequestContext } from "@/lib/security/request-context";
import { enforceSecurityGuard } from "@/lib/security/security-guard";
import { recordSecurityEvent } from "@/lib/security/security-event-service";
import { isLikelyBot } from "@/lib/security/user-agent-parser";

/**
 * POST /api/auth/register — Neuen Nutzer registrieren.
 */
export async function POST(request: Request): Promise<Response> {
  const guardResponse = await enforceSecurityGuard(request, {
    rateLimitScope: "register",
    blockBots: true,
  });

  if (guardResponse) {
    return guardResponse;
  }

  const context = buildSecurityRequestContext(request);
  const body = await parseJsonBody(request);

  if (!body) {
    return jsonFromAuthResult(
      userFailure({
        code: "VALIDATION_ERROR",
        message: "Ungültiger JSON-Body.",
      }),
    );
  }

  const input = parseRegisterBody(body);

  if (!input) {
    return jsonFromAuthResult(
      userFailure({
        code: "VALIDATION_ERROR",
        message:
          "Pflichtfelder fehlen: E-Mail, Passwort, Vorname, Nachname und vollständige Adresse.",
      }),
    );
  }

  const result = await registerUser(input);

  if (!result.success) {
    if (isLikelyBot(context.userAgent)) {
      await recordSecurityEvent({
        eventType: "REGISTRATION_SPAM",
        riskLevel: "medium",
        context,
      });
    }

    return jsonFromAuthResult(result);
  }

  await setSessionCookie(
    result.data.id,
    result.data.systemRole,
    result.data.maintenanceBypass,
    request,
  );

  const verificationResult = await requestEmailVerification({
    userId: result.data.id,
  });

  const devVerificationLink =
    verificationResult.success && verificationResult.data.devActionLink
      ? verificationResult.data.devActionLink
      : undefined;

  return jsonAuthSuccess(
    {
      user: result.data,
      devVerificationLink,
    },
    201,
  );
}
