import { jsonAuthSuccess } from "@/lib/auth/auth-api-utils";
import { clearSessionCookie } from "@/lib/auth/session";

/**
 * POST /api/auth/logout — Session beenden.
 */
export async function POST(): Promise<Response> {
  await clearSessionCookie();

  return jsonAuthSuccess({ loggedOut: true });
}
