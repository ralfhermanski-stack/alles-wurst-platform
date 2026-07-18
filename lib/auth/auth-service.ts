/**
 * @file auth-service.ts
 * @purpose Registrierung, Login, Logout und Session-Auflösung.
 */

import {
  isLoginAllowed,
  loginBlockedMessage,
} from "@/lib/users/account-status";
import {
  createUserWithProfile,
  findUserByEmailForAuth,
  findUserById,
  linkRecipesToUser,
} from "@/lib/users/user-service";
import {
  userFailure,
  userSuccess,
  type UserServiceResult,
} from "@/lib/users/user-errors";
import { prismaRoleToAppRole } from "@/lib/users/membership-mappers";
import type { UserWithRelations } from "@/lib/users/user-types";

import { prisma } from "@/lib/db/prisma";
import { hashPassword, validatePasswordStrength, verifyPassword } from "./password";
import type {
  AuthLinkRecipesResult,
  AuthSessionUser,
  LoginInput,
  RegisterInput,
} from "./auth-types";

import { getPublicUserName } from "@/lib/users/public-user";

const INVALID_CREDENTIALS_MESSAGE =
  "E-Mail oder Passwort ist ungültig.";

function formatDisplayName(
  profile: { firstName: string; lastName: string; publicName?: string | null } | null,
): string {
  return getPublicUserName({ profile });
}

function toAuthSessionUser(user: UserWithRelations): AuthSessionUser {
  return {
    id: user.id,
    email: user.email,
    displayName: formatDisplayName(user.profile),
    systemRole: user.systemRole,
    maintenanceBypass: user.maintenanceBypass,
    emailVerifiedAt: user.emailVerifiedAt?.toISOString() ?? null,
    profile: user.profile
      ? {
          firstName: user.profile.firstName,
          lastName: user.profile.lastName,
          salutation: user.profile.salutation,
          publicName: user.profile.publicName,
          avatarUrl: user.profile.avatarUrl,
          bio: user.profile.bio,
          city: user.profile.city,
          country: user.profile.country,
        }
      : null,
    membership: user.membership
      ? {
          role: prismaRoleToAppRole(user.membership.role),
          status: user.membership.status,
          paymentStatus: user.membership.paymentStatus,
          accessBlocked: user.membership.accessBlocked,
        }
      : null,
  };
}

async function linkRecipesIfNeeded(
  recipeUserId: string | null | undefined,
  registeredUserId: string,
): Promise<UserServiceResult<AuthLinkRecipesResult>> {
  if (!recipeUserId || recipeUserId === registeredUserId) {
    return userSuccess({ updatedCount: 0 });
  }

  return linkRecipesToUser(recipeUserId, registeredUserId);
}

/**
 * Registriert einen neuen Nutzer mit Profil und verknüpft optional Rezepte.
 */
export async function registerUser(
  input: RegisterInput,
): Promise<UserServiceResult<AuthSessionUser>> {
  const passwordError = validatePasswordStrength(input.password);

  if (passwordError) {
    return userFailure({
      code: "VALIDATION_ERROR",
      message: passwordError,
    });
  }

  const inviteToken = input.inviteToken?.trim();

  if (!inviteToken) {
    return userFailure({
      code: "VALIDATION_ERROR",
      message: "Registrierung nur mit gültiger Einladung möglich.",
    });
  }

  const { verifyInviteTokenForRegistration } = await import(
    "@/lib/beta-test/beta-test-service"
  );
  const inviteCheck = await verifyInviteTokenForRegistration(
    inviteToken,
    input.email,
  );

  if (!inviteCheck.ok) {
    return userFailure({
      code: "VALIDATION_ERROR",
      message: inviteCheck.message ?? "Einladung ungültig.",
    });
  }

  const passwordHash = await hashPassword(input.password);

  const createResult = await createUserWithProfile({
    email: input.email,
    passwordHash,
    profile: input.profile,
    linkRecipeUserId: input.recipeUserId,
  });

  if (!createResult.success) {
    return createResult;
  }

  const linkResult = await linkRecipesIfNeeded(
    input.recipeUserId,
    createResult.data.id,
  );

  if (!linkResult.success) {
    return linkResult;
  }

  const userResult = await findUserById(createResult.data.id);

  if (!userResult.success || !userResult.data) {
    return userFailure({
      code: "INTERNAL_ERROR",
      message: "Registrierung abgeschlossen, aber Nutzer konnte nicht geladen werden.",
    });
  }

  const { acceptBetaInviteAfterRegistration } = await import(
    "@/lib/beta-test/beta-test-service"
  );

  try {
    await acceptBetaInviteAfterRegistration({
      token: inviteToken,
      userId: userResult.data.id,
      email: userResult.data.email,
    });
  } catch (error) {
    return userFailure({
      code: "VALIDATION_ERROR",
      message:
        error instanceof Error
          ? error.message
          : "Einladung konnte nicht angenommen werden.",
    });
  }

  const refreshed = await findUserById(userResult.data.id);

  if (refreshed.success && refreshed.data) {
    return userSuccess(toAuthSessionUser(refreshed.data));
  }

  return userSuccess(toAuthSessionUser(userResult.data));
}

/**
 * Meldet einen Nutzer mit E-Mail und Passwort an.
 */
export async function loginUser(
  input: LoginInput,
): Promise<UserServiceResult<AuthSessionUser>> {
  const email = input.email.trim().toLowerCase();

  if (!email || !input.password) {
    return userFailure({
      code: "VALIDATION_ERROR",
      message: "E-Mail und Passwort sind erforderlich.",
    });
  }

  const userResult = await findUserByEmailForAuth(email);

  if (!userResult.success) {
    return userResult;
  }

  const user = userResult.data;

  if (!user || !user.passwordHash) {
    return userFailure({
      code: "FORBIDDEN",
      message: INVALID_CREDENTIALS_MESSAGE,
    });
  }

  const passwordValid = await verifyPassword(input.password, user.passwordHash);

  if (!passwordValid) {
    return userFailure({
      code: "FORBIDDEN",
      message: INVALID_CREDENTIALS_MESSAGE,
    });
  }

  if (!isLoginAllowed(user.accountStatus, user.deletedAt)) {
    return userFailure({
      code: "FORBIDDEN",
      message: loginBlockedMessage(user.accountStatus),
    });
  }

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });
  } catch {
    // Login nicht blockieren, wenn lastLoginAt noch nicht migriert ist.
  }

  const linkResult = await linkRecipesIfNeeded(input.recipeUserId, user.id);

  if (!linkResult.success) {
    return linkResult;
  }

  const freshUserResult = await findUserById(user.id);

  if (!freshUserResult.success) {
    return freshUserResult;
  }

  if (!freshUserResult.data) {
    return userFailure({
      code: "INTERNAL_ERROR",
      message: "Anmeldung abgeschlossen, aber Nutzer konnte nicht geladen werden.",
    });
  }

  if (process.env.NODE_ENV === "development") {
    console.info("[auth/login] Session-Nutzer", {
      userId: freshUserResult.data.id,
      email: freshUserResult.data.email,
      systemRole: freshUserResult.data.systemRole ?? "(fehlt)",
    });
  }

  return userSuccess(toAuthSessionUser(freshUserResult.data));
}

/**
 * Lädt den aktuellen Nutzer anhand der Session-userId.
 */
export async function getSessionUser(
  userId: string,
): Promise<UserServiceResult<AuthSessionUser | null>> {
  const userResult = await findUserById(userId);

  if (!userResult.success) {
    return userResult;
  }

  if (!userResult.data) {
    return userSuccess(null);
  }

  if (!isLoginAllowed(userResult.data.accountStatus, userResult.data.deletedAt)) {
    return userSuccess(null);
  }

  return userSuccess(toAuthSessionUser(userResult.data));
}
