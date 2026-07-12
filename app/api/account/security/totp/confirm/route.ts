import { getSessionUserIdFromRequest } from "@/lib/auth/session";
import { jsonAuthSuccess, jsonFromAuthResult, parseJsonBody, getStringField } from "@/lib/auth/auth-api-utils";
import { userFailure } from "@/lib/users/user-errors";
import { confirmTotpSetup } from "@/lib/security/totp-service";
import { getClientIpFromRequest } from "@/lib/security/client-ip";

export async function POST(request: Request) {
  const userId = await getSessionUserIdFromRequest(request);

  if (!userId) {
    return jsonFromAuthResult(
      userFailure({ code: "UNAUTHORIZED", message: "Anmeldung erforderlich." }),
    );
  }

  const body = await parseJsonBody(request);
  const code = body ? getStringField(body, "code") : null;

  if (!code) {
    return jsonFromAuthResult(
      userFailure({ code: "VALIDATION_ERROR", message: "Code erforderlich." }),
    );
  }

  try {
    const result = await confirmTotpSetup(userId, code, getClientIpFromRequest(request));
    return jsonAuthSuccess(result);
  } catch (error) {
    return jsonFromAuthResult(
      userFailure({
        code: "VALIDATION_ERROR",
        message: error instanceof Error ? error.message : "Bestätigung fehlgeschlagen.",
      }),
    );
  }
}
