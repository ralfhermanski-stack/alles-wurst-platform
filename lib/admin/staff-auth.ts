/**
 * @file staff-auth.ts
 * @purpose Staff-Zugriff für Support-Bereich (ADMIN + SUPPORT).
 */

import {
  getSessionUserIdFromCookies,
  getSessionUserIdFromRequest,
} from "@/lib/auth/session";
import { findUserById } from "@/lib/users/user-service";
import { isLoginAllowed } from "@/lib/users/account-status";
import { getPublicUserName } from "@/lib/users/public-user";
import {
  userFailure,
  userSuccess,
  type UserServiceResult,
} from "@/lib/users/user-errors";

import { canAccessSupportAdmin } from "@/lib/support/support-permissions";
import type { AdminActor } from "./admin-types";

export async function assertStaffAccessFromRequest(
  request: Request,
): Promise<UserServiceResult<AdminActor>> {
  const sessionUserId = await getSessionUserIdFromRequest(request);

  if (!sessionUserId) {
    return userFailure({
      code: "UNAUTHORIZED",
      message: "Anmeldung erforderlich.",
    });
  }

  return assertStaffAccessByUserId(sessionUserId);
}

export async function assertStaffAccessFromCookies(): Promise<
  UserServiceResult<AdminActor>
> {
  const sessionUserId = await getSessionUserIdFromCookies();

  if (!sessionUserId) {
    return userFailure({
      code: "UNAUTHORIZED",
      message: "Anmeldung erforderlich.",
    });
  }

  return assertStaffAccessByUserId(sessionUserId);
}

async function assertStaffAccessByUserId(
  userId: string,
): Promise<UserServiceResult<AdminActor>> {
  const userResult = await findUserById(userId);

  if (!userResult.success || !userResult.data) {
    return userFailure({
      code: "UNAUTHORIZED",
      message: "Anmeldung erforderlich.",
    });
  }

  const user = userResult.data;

  if (!isLoginAllowed(user.accountStatus, user.deletedAt)) {
    return userFailure({
      code: "FORBIDDEN",
      message: "Dein Konto ist gesperrt oder deaktiviert.",
    });
  }

  if (!canAccessSupportAdmin(user.systemRole)) {
    return userFailure({
      code: "FORBIDDEN",
      message: "Kein Zugriff auf den Support-Bereich.",
    });
  }

  return userSuccess({
    userId: user.id,
    email: user.email,
    displayName: getPublicUserName({ profile: user.profile }),
    systemRole: user.systemRole,
  });
}
