/**
 * @file granular-admin-auth.ts
 * @purpose Admin-Zugriff mit granularen Berechtigungen.
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

import { findAdminApiPermission } from "./admin-api-permissions";
import {
  hasAnyPermissionForUser,
  hasPermission,
  isSuperAdmin,
  resolveUserPermissions,
} from "./permission-service";

import type { AdminActor } from "../admin/admin-types";

type LoadedUser = NonNullable<
  Awaited<ReturnType<typeof findUserById>> extends UserServiceResult<infer T>
    ? T
    : never
>;

function toActor(user: LoadedUser): AdminActor {
  return {
    userId: user.id,
    email: user.email,
    displayName: getPublicUserName({ profile: user.profile }),
    systemRole: user.systemRole,
  };
}

async function loadActiveUser(
  userId: string,
): Promise<UserServiceResult<LoadedUser>> {
  const userResult = await findUserById(userId);

  if (!userResult.success || !userResult.data) {
    return userResult as UserServiceResult<LoadedUser>;
  }

  if (!isLoginAllowed(userResult.data.accountStatus, userResult.data.deletedAt)) {
    return userFailure({
      code: "FORBIDDEN",
      message: "Dein Konto ist gesperrt oder deaktiviert.",
    });
  }

  return userResult as UserServiceResult<LoadedUser>;
}

export async function assertGranularAdminAccessFromRequest(
  request: Request,
): Promise<UserServiceResult<AdminActor>> {
  const sessionUserId = await getSessionUserIdFromRequest(request);

  if (!sessionUserId) {
    return userFailure({
      code: "UNAUTHORIZED",
      message: "Anmeldung erforderlich.",
    });
  }

  const url = new URL(request.url);
  return assertGranularAdminAccessByUserId(
    sessionUserId,
    findAdminApiPermission(url.pathname),
  );
}

export async function assertGranularAdminAccessByUserId(
  userId: string,
  permissionKey: string | null,
): Promise<UserServiceResult<AdminActor>> {
  const userResult = await loadActiveUser(userId);

  if (!userResult.success || !userResult.data) {
    return userResult as UserServiceResult<AdminActor>;
  }

  const user = userResult.data;

  if (await isSuperAdmin(userId)) {
    return userSuccess(toActor(user));
  }

  if (permissionKey && (await hasPermission(userId, permissionKey))) {
    return userSuccess(toActor(user));
  }

  if (isAdminSystemRole(user.systemRole)) {
    return userSuccess(toActor(user));
  }

  const fallbackKeys = permissionKey
    ? [
        permissionKey,
        permissionKey.replace(".view", ".open"),
        permissionKey.replace(".view", ".manage"),
      ]
    : [];

  if (fallbackKeys.length > 0 && (await hasAnyPermissionForUser(userId, fallbackKeys))) {
    return userSuccess(toActor(user));
  }

  return userFailure({
    code: "FORBIDDEN",
    message: permissionKey
      ? `Zugriff verweigert (fehlende Berechtigung: ${permissionKey}).`
      : "Zugriff verweigert.",
  });
}

export async function getEffectivePermissionKeysForUser(
  userId: string,
): Promise<string[]> {
  const map = await resolveUserPermissions(userId);
  return [...map.entries()]
    .filter(([, value]) => value.allowed)
    .map(([key]) => key);
}

export async function getSessionPermissionKeysFromCookies(): Promise<string[]> {
  const userId = await getSessionUserIdFromCookies();

  if (!userId) {
    return [];
  }

  return getEffectivePermissionKeysForUser(userId);
}
