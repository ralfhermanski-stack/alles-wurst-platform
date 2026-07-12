/**
 * @file accounting-auth.ts
 * @purpose Zugriffskontrolle für Buchhaltung (Session + Rolle accounting/admin).
 */

import {
  getSessionUserIdFromCookies,
  getSessionUserIdFromRequest,
} from "@/lib/auth/session";
import { findUserById } from "@/lib/users/user-service";
import { isAdminSystemRole } from "@/lib/users/system-role";
import {
  userFailure,
  userSuccess,
  type UserServiceResult,
} from "@/lib/users/user-errors";

import type { AccountingActor } from "./accounting-types";
import { formatUserDisplayName } from "./accounting-types";

const ACCESS_DENIED_MESSAGE =
  "Zugriff verweigert. Nur Buchhaltung und Administratoren haben Zugang.";

function toAccountingActor(
  user: NonNullable<
    Awaited<ReturnType<typeof findUserById>> extends UserServiceResult<infer T>
      ? T
      : never
  >,
): AccountingActor | null {
  if (isAdminSystemRole(user.systemRole)) {
    return {
      userId: user.id,
      email: user.email,
      displayName: formatUserDisplayName(user),
      role: "admin",
    };
  }

  const role = user.membership?.role;

  if (role !== "accounting") {
    return null;
  }

  return {
    userId: user.id,
    email: user.email,
    displayName: formatUserDisplayName(user),
    role,
  };
}

/**
 * Prüft Session-Zugriff für API-Routen (Request mit Cookie-Header).
 */
export async function assertAccountingAccessFromRequest(
  request: Request,
): Promise<UserServiceResult<AccountingActor>> {
  const sessionUserId = await getSessionUserIdFromRequest(request);

  if (!sessionUserId) {
    return userFailure({
      code: "UNAUTHORIZED",
      message: "Anmeldung erforderlich.",
    });
  }

  return assertAccountingAccessByUserId(sessionUserId);
}

/**
 * Prüft Session-Zugriff serverseitig (Cookie-Store).
 */
export async function assertAccountingAccessFromCookies(): Promise<
  UserServiceResult<AccountingActor>
> {
  const sessionUserId = await getSessionUserIdFromCookies();

  if (!sessionUserId) {
    return userFailure({
      code: "UNAUTHORIZED",
      message: "Anmeldung erforderlich.",
    });
  }

  return assertAccountingAccessByUserId(sessionUserId);
}

async function assertAccountingAccessByUserId(
  userId: string,
): Promise<UserServiceResult<AccountingActor>> {
  const userResult = await findUserById(userId);

  if (!userResult.success) {
    return userResult;
  }

  if (!userResult.data) {
    return userFailure({
      code: "FORBIDDEN",
      message: ACCESS_DENIED_MESSAGE,
    });
  }

  const actor = toAccountingActor(userResult.data);

  if (!actor) {
    return userFailure({
      code: "FORBIDDEN",
      message: ACCESS_DENIED_MESSAGE,
    });
  }

  return userSuccess(actor);
}

/**
 * Admin darf zusätzliche Aktionen — accounting nicht.
 */
export function isAdminActor(actor: AccountingActor): boolean {
  return actor.role === "admin";
}
