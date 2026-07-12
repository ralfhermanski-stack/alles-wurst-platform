import { getSessionUser } from "@/lib/auth/auth-service";
import { jsonAuthSuccess, jsonFromAuthResult } from "@/lib/auth/auth-api-utils";
import {
  getSessionUserIdFromCookies,
  setSessionCookie,
} from "@/lib/auth/session";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session-token";
import { cookies } from "next/headers";

/**
 * GET /api/auth/session — Aktuellen Nutzer aus Session laden.
 */
export async function GET(): Promise<Response> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const userId = await getSessionUserIdFromCookies();

  if (!userId) {
    return jsonAuthSuccess(null);
  }

  const result = await getSessionUser(userId);

  if (!result.success || !result.data) {
    return jsonFromAuthResult(result);
  }

  const tokenPayload = token ? await verifySessionToken(token) : null;

  if (
    !tokenPayload?.systemRole
    || tokenPayload.systemRole !== result.data.systemRole
    || Boolean(tokenPayload.maintenanceBypass) !== result.data.maintenanceBypass
  ) {
    await setSessionCookie(
      result.data.id,
      result.data.systemRole,
      result.data.maintenanceBypass,
    );

    if (process.env.NODE_ENV === "development") {
      console.info("[auth/session] Cookie aktualisiert", {
        userId: result.data.id,
        email: result.data.email,
        systemRole: result.data.systemRole,
        previousTokenRole: tokenPayload?.systemRole ?? null,
      });
    }
  }

  return jsonFromAuthResult(result);
}
