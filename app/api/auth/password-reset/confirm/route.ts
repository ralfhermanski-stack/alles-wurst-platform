import { confirmPasswordReset } from "@/lib/auth/password-reset-service";
import {
  getStringField,
  jsonFromAuthResult,
  parseJsonBody,
} from "@/lib/auth/auth-api-utils";
import { userFailure } from "@/lib/users/user-errors";

/**
 * POST /api/auth/password-reset/confirm — Neues Passwort mit Token setzen.
 */
export async function POST(request: Request): Promise<Response> {
  const body = await parseJsonBody(request);

  if (!body) {
    return jsonFromAuthResult(
      userFailure({
        code: "VALIDATION_ERROR",
        message: "Ungültiger JSON-Body.",
      }),
    );
  }

  const token = getStringField(body, "token");
  const password = getStringField(body, "password");

  if (!token || !password) {
    return jsonFromAuthResult(
      userFailure({
        code: "VALIDATION_ERROR",
        message: "Token und neues Passwort sind erforderlich.",
      }),
    );
  }

  const result = await confirmPasswordReset({ token, password });

  return jsonFromAuthResult(result);
}
