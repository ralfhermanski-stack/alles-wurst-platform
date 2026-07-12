/**
 * @file permission-auth.ts
 * @purpose Auth-Guards für Berechtigungsverwaltung.
 */

import {
  getSessionUserIdFromCookies,
  getSessionUserIdFromRequest,
} from "@/lib/auth/session";
import { findUserById } from "@/lib/users/user-service";
import { isLoginAllowed } from "@/lib/users/account-status";
import { isSuperAdminSystemRole } from "@/lib/users/system-role";
import {
  userFailure,
  userSuccess,
  type UserServiceResult,
} from "@/lib/users/user-errors";

import { hasPermission } from "./permission-service";

export type PermissionActor = {
  userId: string;
  email: string;
  systemRole: string;
  isSuperAdmin: boolean;
};

async function loadActor(userId: string): Promise<UserServiceResult<PermissionActor>> {
  const userResult = await findUserById(userId);

  if (!userResult.success) {
    return userResult;
  }

  const user = userResult.data;

  if (!user) {
    return userFailure({
      code: "NOT_FOUND",
      message: "Nutzer nicht gefunden.",
    });
  }

  if (!isLoginAllowed(user.accountStatus, user.deletedAt)) {
    return userFailure({
      code: "FORBIDDEN",
      message: "Konto ist nicht aktiv.",
    });
  }

  return userSuccess({
    userId: user.id,
    email: user.email,
    systemRole: user.systemRole,
    isSuperAdmin: isSuperAdminSystemRole(user.systemRole),
  });
}

export async function assertPermissionAccessFromRequest(
  request: Request,
  permissionKey = "system.permissions.manage",
): Promise<UserServiceResult<PermissionActor>> {
  const sessionUserId = await getSessionUserIdFromRequest(request);

  if (!sessionUserId) {
    return userFailure({
      code: "UNAUTHORIZED",
      message: "Anmeldung erforderlich.",
    });
  }

  const actorResult = await loadActor(sessionUserId);

  if (!actorResult.success) {
    return actorResult;
  }

  const allowed =
    actorResult.data.isSuperAdmin ||
    (await hasPermission(actorResult.data.userId, permissionKey));

  if (!allowed) {
    return userFailure({
      code: "FORBIDDEN",
      message: "Keine Berechtigung für die Rechteverwaltung.",
    });
  }

  return actorResult;
}

export async function assertPermissionAccessFromCookies(
  permissionKey = "system.permissions.manage",
): Promise<UserServiceResult<PermissionActor>> {
  const sessionUserId = await getSessionUserIdFromCookies();

  if (!sessionUserId) {
    return userFailure({
      code: "UNAUTHORIZED",
      message: "Anmeldung erforderlich.",
    });
  }

  const actorResult = await loadActor(sessionUserId);

  if (!actorResult.success) {
    return actorResult;
  }

  const allowed =
    actorResult.data.isSuperAdmin ||
    (await hasPermission(actorResult.data.userId, permissionKey));

  if (!allowed) {
    return userFailure({
      code: "FORBIDDEN",
      message: "Keine Berechtigung für die Rechteverwaltung.",
    });
  }

  return actorResult;
}

export async function assertAnyAdminPermissionFromRequest(
  request: Request,
  permissionKeys: string[],
): Promise<UserServiceResult<PermissionActor>> {
  const sessionUserId = await getSessionUserIdFromRequest(request);

  if (!sessionUserId) {
    return userFailure({
      code: "UNAUTHORIZED",
      message: "Anmeldung erforderlich.",
    });
  }

  const actorResult = await loadActor(sessionUserId);

  if (!actorResult.success) {
    return actorResult;
  }

  if (actorResult.data.isSuperAdmin) {
    return actorResult;
  }

  for (const key of permissionKeys) {
    if (await hasPermission(actorResult.data.userId, key)) {
      return actorResult;
    }
  }

  return userFailure({
    code: "FORBIDDEN",
    message: "Zugriff verweigert.",
  });
}
