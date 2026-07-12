/**
 * @file admin-auth.ts
 * @purpose Session-basierter Admin-Zugriff (User.systemRole = ADMIN).
 */

import {
  getSessionUserIdFromCookies,
  getSessionUserIdFromRequest,
} from "@/lib/auth/session";
import { findUserById } from "@/lib/users/user-service";
import { isLoginAllowed } from "@/lib/users/account-status";
import { getPublicUserName } from "@/lib/users/public-user";
import { isAdminSystemRole } from "@/lib/users/system-role";
import {
  userFailure,
  userSuccess,
  type UserServiceResult,
} from "@/lib/users/user-errors";

import type { AdminActor } from "./admin-types";

const ACCESS_DENIED_MESSAGE =
  "Zugriff verweigert. Nur Administratoren haben Zugang.";

function toAdminActor(
  user: NonNullable<
    Awaited<ReturnType<typeof findUserById>> extends UserServiceResult<infer T>
      ? T
      : never
  >,
): AdminActor | null {
  if (!isAdminSystemRole(user.systemRole)) {
    return null;
  }

  return {
    userId: user.id,
    email: user.email,
    displayName: getPublicUserName({ profile: user.profile }),
    systemRole: user.systemRole,
  };
}

export async function assertAdminAccessFromRequest(
  request: Request,
): Promise<UserServiceResult<AdminActor>> {
  const sessionUserId = await getSessionUserIdFromRequest(request);

  if (!sessionUserId) {
    return userFailure({
      code: "UNAUTHORIZED",
      message: "Anmeldung erforderlich.",
    });
  }

  return assertAdminAccessByUserId(sessionUserId);
}

export async function assertAdminAccessFromCookies(): Promise<
  UserServiceResult<AdminActor>
> {
  const sessionUserId = await getSessionUserIdFromCookies();

  if (!sessionUserId) {
    return userFailure({
      code: "UNAUTHORIZED",
      message: "Anmeldung erforderlich.",
    });
  }

  return assertAdminAccessByUserId(sessionUserId);
}

async function assertAdminAccessByUserId(
  userId: string,
): Promise<UserServiceResult<AdminActor>> {
  const userResult = await findUserById(userId);

  if (!userResult.success) {
    return userResult;
  }

  if (!userResult.data) {
    return userFailure({
      code: "UNAUTHORIZED",
      message: "Anmeldung erforderlich.",
    });
  }

  if (!isLoginAllowed(userResult.data.accountStatus, userResult.data.deletedAt)) {
    return userFailure({
      code: "FORBIDDEN",
      message: "Dein Konto ist gesperrt oder deaktiviert.",
    });
  }

  if (process.env.NODE_ENV === "development") {
    console.info("[admin-auth] Prüfung", {
      userId,
      email: userResult.data.email,
      dbSystemRole: userResult.data.systemRole ?? "(fehlt — Prisma-Client neu generieren)",
      isAdmin: isAdminSystemRole(userResult.data.systemRole),
    });
  }

  const actor = toAdminActor(userResult.data);

  if (!actor) {
    return userFailure({
      code: "FORBIDDEN",
      message: `${ACCESS_DENIED_MESSAGE} (Angemeldet als ${userResult.data.email}, Rolle: ${userResult.data.systemRole ?? "unbekannt"})`,
    });
  }

  return userSuccess(actor);
}
