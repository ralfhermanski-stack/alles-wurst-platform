import { loginUser } from "@/lib/auth/auth-service";
import {
  getStringField,
  jsonAuthSuccess,
  jsonFromAuthResult,
  parseJsonBody,
} from "@/lib/auth/auth-api-utils";
import { setSessionCookie } from "@/lib/auth/session";
import { isAdminSystemRole } from "@/lib/users/system-role";
import { userFailure } from "@/lib/users/user-errors";
import { evaluateAndApplyIpBlock } from "@/lib/security/ip-block-service";
import { createPendingLoginToken } from "@/lib/security/pending-login-token";
import { buildSecurityRequestContext } from "@/lib/security/request-context";
import { enforceSecurityGuard } from "@/lib/security/security-guard";
import { recordSecurityEvent } from "@/lib/security/security-event-service";
import { isTotpEnabled, verifyUserTotp } from "@/lib/security/totp-service";

/**
 * POST /api/auth/login — Nutzer anmelden (mit Security-Guards und optional 2FA).
 */
export async function POST(request: Request): Promise<Response> {
  const guardResponse = await enforceSecurityGuard(request, {
    rateLimitScope: "login",
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

  const email = getStringField(body, "email");
  const password = getStringField(body, "password");
  const recipeUserId = getStringField(body, "recipeUserId");
  const totpCode = getStringField(body, "totpCode");
  const pendingToken = getStringField(body, "pendingToken");

  if (pendingToken && totpCode) {
    const { verifyPendingLoginToken } = await import(
      "@/lib/security/pending-login-token"
    );
    const userId = verifyPendingLoginToken(pendingToken);

    if (!userId) {
      return jsonFromAuthResult(
        userFailure({
          code: "FORBIDDEN",
          message: "Die Anmeldesitzung ist abgelaufen. Bitte erneut anmelden.",
        }),
      );
    }

    const totpValid = await verifyUserTotp(userId, totpCode);

    if (!totpValid) {
      await recordSecurityEvent({
        eventType: "TOTP_FAILED",
        riskLevel: "high",
        userId,
        context,
      });

      return jsonFromAuthResult(
        userFailure({
          code: "FORBIDDEN",
          message: "Ungültiger Zwei-Faktor-Code.",
        }),
      );
    }

    const { getSessionUser } = await import("@/lib/auth/auth-service");
    const userResult = await getSessionUser(userId);

    if (!userResult.success || !userResult.data) {
      return jsonFromAuthResult(userResult);
    }

    await setSessionCookie(
      userResult.data.id,
      userResult.data.systemRole,
      userResult.data.maintenanceBypass,
      request,
    );

    await recordSecurityEvent({
      eventType: "TOTP_SUCCESS",
      userId,
      context,
    });

    return jsonAuthSuccess(userResult.data);
  }

  if (!email || !password) {
    return jsonFromAuthResult(
      userFailure({
        code: "VALIDATION_ERROR",
        message: "E-Mail und Passwort sind erforderlich.",
      }),
    );
  }

  const result = await loginUser({
    email,
    password,
    recipeUserId: recipeUserId ?? null,
  });

  if (!result.success) {
    const { findUserByEmailForAuth } = await import("@/lib/users/user-service");
    const lookup = await findUserByEmailForAuth(email.trim().toLowerCase());
    const isAdminAttempt =
      lookup.success
      && lookup.data
      && isAdminSystemRole(lookup.data.systemRole);

    await recordSecurityEvent({
      eventType: isAdminAttempt ? "ADMIN_LOGIN_FAILED" : "LOGIN_FAILED",
      riskLevel: "medium",
      context,
      description: result.error.message,
      metadata: { email: email.trim().toLowerCase() },
    });

    if (context.ipAddress) {
      await evaluateAndApplyIpBlock({
        ipAddress: context.ipAddress,
        context,
      });
    }

    return jsonFromAuthResult(result);
  }

  const user = result.data;
  const needsTotp = await isTotpEnabled(user.id);

  if (needsTotp) {
    return jsonAuthSuccess({
      requiresTotp: true,
      pendingToken: createPendingLoginToken(user.id),
      email: user.email,
    });
  }

  const requiredTotpForRole =
    isAdminSystemRole(user.systemRole)
    || user.systemRole === "SUPPORT"
    || user.systemRole === "INSTRUCTOR";

  if (requiredTotpForRole) {
    const { isTotpRequiredForUser } = await import("@/lib/security/totp-service");
    const mustSetup = await isTotpRequiredForUser(user.id, user.systemRole);

    if (mustSetup) {
      await setSessionCookie(
        user.id,
        user.systemRole,
        user.maintenanceBypass,
        request,
      );

      return jsonAuthSuccess({
        ...user,
        requiresTotpSetup: true,
      });
    }
  }

  await setSessionCookie(
    user.id,
    user.systemRole,
    user.maintenanceBypass,
    request,
  );

  return jsonAuthSuccess(user);
}
