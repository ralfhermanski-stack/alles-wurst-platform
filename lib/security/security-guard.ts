/**
 * @file security-guard.ts
 * @purpose Zentraler Sicherheits-Guard für API-Routen.
 */

import { userErrorToStatus } from "@/lib/users/user-errors";

import { checkIpBlock } from "./ip-block-service";
import { checkRateLimit } from "./rate-limit-service";
import { buildSecurityRequestContext } from "./request-context";
import { isLikelyBot } from "./user-agent-parser";
import { recordSecurityEvent } from "./security-event-service";
import type { RateLimitScope } from "./security-types";

function securityErrorResponse(
  code: "FORBIDDEN" | "UNAUTHORIZED",
  message: string,
  status: number,
  headers?: Record<string, string>,
): Response {
  return Response.json(
    { success: false, error: { code, message } },
    { status, headers },
  );
}

export type SecurityGuardOptions = {
  rateLimitScope?: RateLimitScope;
  userId?: string | null;
  blockBots?: boolean;
};

export async function enforceSecurityGuard(
  request: Request,
  options: SecurityGuardOptions = {},
): Promise<Response | null> {
  const context = buildSecurityRequestContext(request);

  if (options.blockBots && isLikelyBot(context.userAgent)) {
    await recordSecurityEvent({
      eventType: "BOT_ACTIVITY",
      riskLevel: "medium",
      userId: options.userId,
      context,
      description: "Bot-Aktivität erkannt",
    });

    return securityErrorResponse(
      "FORBIDDEN",
      "Zugriff verweigert.",
      userErrorToStatus("FORBIDDEN"),
    );
  }

  const ipCheck = await checkIpBlock(context.ipAddress);

  if (ipCheck.blocked) {
    return securityErrorResponse(
      "FORBIDDEN",
      "Zugriff vorübergehend gesperrt. Bitte später erneut versuchen.",
      429,
      ipCheck.retryAfterSeconds
        ? { "Retry-After": String(ipCheck.retryAfterSeconds) }
        : undefined,
    );
  }

  if (ipCheck.throttleMs) {
    await new Promise((resolve) => setTimeout(resolve, ipCheck.throttleMs));
  }

  if (options.rateLimitScope) {
    const rate = await checkRateLimit({
      scope: options.rateLimitScope,
      ipAddress: context.ipAddress,
      userId: options.userId,
      context,
    });

    if (!rate.allowed) {
      return securityErrorResponse(
        "FORBIDDEN",
        "Zu viele Anfragen. Bitte warte kurz und versuche es erneut.",
        429,
        rate.retryAfterMs
          ? { "Retry-After": String(Math.ceil(rate.retryAfterMs / 1000)) }
          : undefined,
      );
    }
  }

  if (ipCheck.requireCaptcha) {
    const captchaToken = request.headers.get("x-captcha-token");

    if (!captchaToken) {
      await recordSecurityEvent({
        eventType: "CAPTCHA_REQUIRED",
        riskLevel: "medium",
        userId: options.userId,
        context,
      });

      return securityErrorResponse("FORBIDDEN", "Captcha erforderlich.", 428);
    }
  }

  return null;
}
