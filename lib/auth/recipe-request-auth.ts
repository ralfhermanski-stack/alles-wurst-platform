/**
 * @file recipe-request-auth.ts
 * @purpose Session-basierte User- und Membership-Auflösung für Rezept-APIs.
 */

import { getSessionUserIdFromRequest } from "@/lib/auth/session";
import type { MembershipAccessContext } from "@/lib/membership/membership-rules";
import { buildMembershipContextFromRequest } from "@/lib/membership/membership-api";
import { resolveMembershipAccessFromDb } from "@/lib/users/membership-service";
import { extractUserId } from "@/lib/tools/recipe-api-utils";

/**
 * Ermittelt userId: Session-Cookie hat Vorrang, sonst Query/Body (localStorage-Prototyp).
 */
export async function resolveRecipeUserId(
  request: Request,
  body?: Record<string, unknown> | null,
): Promise<string | null> {
  const sessionUserId = await getSessionUserIdFromRequest(request);

  if (sessionUserId) {
    return sessionUserId;
  }

  return extractUserId(request, body);
}

/**
 * Baut Membership-Kontext: bei gültiger Session aus DB, sonst Header-Prototyp.
 */
export async function buildRecipeMembershipContext(
  request: Request,
  userId: string | null,
  body?: Record<string, unknown> | null,
): Promise<MembershipAccessContext> {
  const sessionUserId = await getSessionUserIdFromRequest(request);

  if (sessionUserId) {
    const dbResult = await resolveMembershipAccessFromDb(sessionUserId);

    if (dbResult.success) {
      return dbResult.data;
    }
  }

  return buildMembershipContextFromRequest(request, userId, body);
}
