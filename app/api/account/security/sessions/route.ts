import { getSessionUserIdFromRequest } from "@/lib/auth/session";
import { jsonFromAuthResult, jsonAuthSuccess } from "@/lib/auth/auth-api-utils";
import { userFailure } from "@/lib/users/user-errors";
import {
  listUserSessions,
  revokeAllUserSessions,
  revokeUserSession,
} from "@/lib/security/session-registry-service";
import { getClientIpFromRequest } from "@/lib/security/client-ip";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth/session-token";
import { hashSessionToken } from "@/lib/security/session-registry-service";

export async function GET(request: Request) {
  const userId = await getSessionUserIdFromRequest(request);

  if (!userId) {
    return jsonFromAuthResult(
      userFailure({ code: "UNAUTHORIZED", message: "Anmeldung erforderlich." }),
    );
  }

  const sessions = await listUserSessions(userId);
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const currentHash = token ? hashSessionToken(token) : null;

  return jsonAuthSuccess(
    sessions.map((session) => ({
      ...session,
      isCurrent: session.tokenHash === currentHash,
    })),
  );
}

export async function DELETE(request: Request) {
  const userId = await getSessionUserIdFromRequest(request);

  if (!userId) {
    return jsonFromAuthResult(
      userFailure({ code: "UNAUTHORIZED", message: "Anmeldung erforderlich." }),
    );
  }

  const body = (await request.json().catch(() => null)) as {
    sessionId?: string;
    all?: boolean;
  } | null;

  const ipAddress = getClientIpFromRequest(request);

  if (body?.all) {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    const payload = token ? await verifySessionToken(token) : null;

    await revokeAllUserSessions(userId, payload?.sessionId, userId, ipAddress);
    return jsonAuthSuccess({ revoked: "all" });
  }

  if (!body?.sessionId) {
    return jsonFromAuthResult(
      userFailure({ code: "VALIDATION_ERROR", message: "sessionId erforderlich." }),
    );
  }

  await revokeUserSession(userId, body.sessionId, userId, ipAddress);
  return jsonAuthSuccess({ revoked: body.sessionId });
}
