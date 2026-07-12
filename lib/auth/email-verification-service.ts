/**
 * @file email-verification-service.ts
 * @purpose E-Mail-Verifikation anfordern und bestätigen.
 */

import { prisma } from "@/lib/db/prisma";
import {
  buildAppUrl,
  buildEmailVerificationMail,
  sendMail,
} from "@/lib/mail/mail-service";
import { findUserByEmail, findUserById } from "@/lib/users/user-service";
import {
  userFailure,
  userSuccess,
  type UserServiceResult,
} from "@/lib/users/user-errors";

import {
  EMAIL_VERIFICATION_TOKEN_TTL_MS,
  generatePlainToken,
  hashPlainToken,
  isTokenExpired,
  verifyPlainTokenHash,
} from "./auth-token";
import type { AuthActionResult } from "./auth-action-types";

const GENERIC_REQUEST_MESSAGE =
  "Falls ein Konto mit dieser E-Mail existiert und noch nicht bestätigt ist, wurde ein Bestätigungslink erstellt.";

const ALREADY_VERIFIED_MESSAGE = "Diese E-Mail-Adresse ist bereits bestätigt.";

const INVALID_TOKEN_MESSAGE =
  "Der Bestätigungslink ist ungültig oder abgelaufen. Bitte fordere einen neuen Link an.";

type RequestEmailVerificationInput = {
  email?: string;
  userId?: string;
};

async function resolveUserForVerification(
  input: RequestEmailVerificationInput,
): Promise<UserServiceResult<{ id: string; email: string; emailVerifiedAt: Date | null } | null>> {
  if (input.userId) {
    const userResult = await findUserById(input.userId);

    if (!userResult.success) {
      return userResult;
    }

    if (!userResult.data) {
      return userSuccess(null);
    }

    return userSuccess({
      id: userResult.data.id,
      email: userResult.data.email,
      emailVerifiedAt: userResult.data.emailVerifiedAt,
    });
  }

  const email = input.email?.trim().toLowerCase();

  if (!email) {
    return userFailure({
      code: "VALIDATION_ERROR",
      message: "E-Mail-Adresse ist erforderlich.",
    });
  }

  const userResult = await findUserByEmail(email);

  if (!userResult.success) {
    return userResult;
  }

  if (!userResult.data) {
    return userSuccess(null);
  }

  return userSuccess({
    id: userResult.data.id,
    email: userResult.data.email,
    emailVerifiedAt: userResult.data.emailVerifiedAt,
  });
}

async function createVerificationToken(userId: string): Promise<{
  plainToken: string;
  expiresAt: Date;
}> {
  const plainToken = generatePlainToken();
  const tokenHash = hashPlainToken(plainToken);
  const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_TOKEN_TTL_MS);

  await prisma.$transaction([
    prisma.emailVerificationToken.deleteMany({ where: { userId } }),
    prisma.emailVerificationToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    }),
  ]);

  return { plainToken, expiresAt };
}

/**
 * Erstellt einen Verifikationslink und sendet (oder loggt) die E-Mail.
 */
export async function requestEmailVerification(
  input: RequestEmailVerificationInput,
): Promise<UserServiceResult<AuthActionResult>> {
  const userResult = await resolveUserForVerification(input);

  if (!userResult.success) {
    return userResult;
  }

  const user = userResult.data;

  if (!user) {
    return userSuccess({ message: GENERIC_REQUEST_MESSAGE });
  }

  if (user.emailVerifiedAt) {
    return userSuccess({ message: ALREADY_VERIFIED_MESSAGE });
  }

  try {
    const { plainToken } = await createVerificationToken(user.id);
    const actionLink = buildAppUrl(
      `/email-bestaetigen?token=${encodeURIComponent(plainToken)}`,
    );

    const mailTemplate = await buildEmailVerificationMail(actionLink);

    const mailResult = await sendMail({
      ...mailTemplate,
      to: user.email,
    });

    return userSuccess({
      message: GENERIC_REQUEST_MESSAGE,
      devActionLink: mailResult.devActionLink,
    });
  } catch {
    return userFailure({
      code: "INTERNAL_ERROR",
      message: "Bestätigungslink konnte nicht erstellt werden.",
    });
  }
}

/**
 * Bestätigt die E-Mail anhand eines Klartext-Tokens.
 */
export async function confirmEmailVerification(
  token: string,
): Promise<UserServiceResult<{ userId: string; message: string }>> {
  const trimmed = token.trim();

  if (!trimmed) {
    return userFailure({
      code: "VALIDATION_ERROR",
      message: "Bestätigungslink ist ungültig.",
    });
  }

  const tokenHash = hashPlainToken(trimmed);

  try {
    const storedToken = await prisma.emailVerificationToken.findFirst({
      where: { tokenHash },
      include: { user: true },
    });

    const tokenValid =
      storedToken &&
      verifyPlainTokenHash(trimmed, storedToken.tokenHash) &&
      !isTokenExpired(storedToken.expiresAt);

    if (!tokenValid || !storedToken) {
      return userFailure({
        code: "VALIDATION_ERROR",
        message: INVALID_TOKEN_MESSAGE,
      });
    }

    if (storedToken.user.emailVerifiedAt) {
      await prisma.emailVerificationToken.deleteMany({
        where: { userId: storedToken.userId },
      });

      return userSuccess({
        userId: storedToken.userId,
        message: ALREADY_VERIFIED_MESSAGE,
      });
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: storedToken.userId },
        data: { emailVerifiedAt: new Date() },
      }),
      prisma.emailVerificationToken.deleteMany({
        where: { userId: storedToken.userId },
      }),
    ]);

    return userSuccess({
      userId: storedToken.userId,
      message: "Deine E-Mail-Adresse wurde erfolgreich bestätigt.",
    });
  } catch {
    return userFailure({
      code: "INTERNAL_ERROR",
      message: "E-Mail-Bestätigung konnte nicht abgeschlossen werden.",
    });
  }
}
