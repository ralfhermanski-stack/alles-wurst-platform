/**
 * @file membership-api.ts
 * @purpose Serverseitige Extraktion des Mitgliedschaftskontexts aus HTTP-Requests.
 */

import {
  createMembershipContext,
  DEFAULT_MEMBERSHIP_ROLE,
  isMembershipRole,
  type MembershipAccessContext,
  type MembershipRole,
} from "./membership-rules";
import {
  MEMBERSHIP_ACCESS_BLOCKED_HEADER,
  MEMBERSHIP_ROLE_HEADER,
} from "./membership-session";

/**
 * Liest die Rolle aus Header oder Body/Query (Prototyp — nicht kryptografisch abgesichert).
 */
export function extractMembershipRole(
  request: Request,
  body?: Record<string, unknown> | null,
): MembershipRole {
  const fromHeader = request.headers.get(MEMBERSHIP_ROLE_HEADER);

  if (fromHeader && isMembershipRole(fromHeader)) {
    return fromHeader;
  }

  if (body && typeof body.membershipRole === "string") {
    if (isMembershipRole(body.membershipRole)) {
      return body.membershipRole;
    }
  }

  const fromQuery = new URL(request.url).searchParams.get("membershipRole");

  if (fromQuery && isMembershipRole(fromQuery)) {
    return fromQuery;
  }

  return DEFAULT_MEMBERSHIP_ROLE;
}

/**
 * Liest die Zugriffssperre aus dem Request (Prototyp).
 */
export function extractAccessBlocked(request: Request): boolean {
  const header = request.headers.get(MEMBERSHIP_ACCESS_BLOCKED_HEADER);

  return header === "1" || header === "true";
}

/**
 * Baut den vollständigen Zugriffskontext für API-Prüfungen.
 */
export function buildMembershipContextFromRequest(
  request: Request,
  userId: string | null,
  body?: Record<string, unknown> | null,
): MembershipAccessContext {
  return createMembershipContext(
    extractMembershipRole(request, body),
    userId,
    extractAccessBlocked(request),
  );
}
