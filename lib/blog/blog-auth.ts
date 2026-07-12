/**
 * @file blog-auth.ts
 * @purpose Blog-Admin-Zugriff (ADMIN + INSTRUCTOR mit Blog-Rechten).
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

import type { AdminActor } from "@/lib/admin/admin-types";
import { canAccessBlogAdmin } from "@/lib/blog/blog-permissions";

export async function assertBlogAccessFromRequest(
  request: Request,
): Promise<UserServiceResult<AdminActor>> {
  const sessionUserId = await getSessionUserIdFromRequest(request);

  if (!sessionUserId) {
    return userFailure({
      code: "UNAUTHORIZED",
      message: "Anmeldung erforderlich.",
    });
  }

  return assertBlogAccessByUserId(sessionUserId);
}

export async function assertBlogAccessFromCookies(): Promise<
  UserServiceResult<AdminActor>
> {
  const sessionUserId = await getSessionUserIdFromCookies();

  if (!sessionUserId) {
    return userFailure({
      code: "UNAUTHORIZED",
      message: "Anmeldung erforderlich.",
    });
  }

  return assertBlogAccessByUserId(sessionUserId);
}

async function assertBlogAccessByUserId(
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

  if (!canAccessBlogAdmin(user.systemRole)) {
    return userFailure({
      code: "FORBIDDEN",
      message: "Kein Zugriff auf den Magazin-Bereich.",
    });
  }

  return userSuccess({
    userId: user.id,
    email: user.email,
    displayName: getPublicUserName({ profile: user.profile }),
    systemRole: user.systemRole,
  });
}
