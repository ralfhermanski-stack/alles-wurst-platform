/**
 * @file password-reset-service.ts
 * @purpose Passwort-Reset anfordern und neues Passwort setzen.
 */

import { prisma } from "@/lib/db/prisma";
import {
  buildAppUrl,
  buildPasswordResetMail,
  sendMail,
} from "@/lib/mail/mail-service";
import { findUserByEmail } from "@/lib/users/user-service";
import {
  userFailure,
  userSuccess,
  type UserServiceResult,
} from "@/lib/users/user-errors";

import {
  generatePlainToken,
  hashPlainToken,
  isTokenExpired,
  PASSWORD_RESET_TOKEN_TTL_MS,
  verifyPlainTokenHash,
} from "./auth-token";
import type { AuthActionResult } from "./auth-action-types";
import { hashPassword, validatePasswordStrength } from "./password";

const GENERIC_REQUEST_MESSAGE =
  "Falls ein Konto mit dieser E-Mail existiert, wurde ein Link zum Zurücksetzen des Passworts erstellt.";

const INVALID_TOKEN_MESSAGE =
  "Der Link zum Zurücksetzen ist ungültig oder abgelaufen. Bitte fordere einen neuen Link an.";

async function createPasswordResetToken(userId: string): Promise<{
  plainToken: string;
  expiresAt: Date;
}> {
  const plainToken = generatePlainToken();
  const tokenHash = hashPlainToken(plainToken);
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_TOKEN_TTL_MS);

  await prisma.$transaction([
    prisma.passwordResetToken.deleteMany({
      where: { userId, usedAt: null },
    }),
    prisma.passwordResetToken.create({
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
 * Erstellt einen Reset-Link und sendet (oder loggt) die E-Mail.
 * Gibt immer dieselbe Meldung zurück (Enumeration-Schutz).
 */
export async function requestPasswordReset(
  email: string,
): Promise<UserServiceResult<AuthActionResult>> {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail) {
    return userFailure({
      code: "VALIDATION_ERROR",
      message: "E-Mail-Adresse ist erforderlich.",
    });
  }

  const userResult = await findUserByEmail(normalizedEmail);

  if (!userResult.success) {
    return userResult;
  }

  const user = userResult.data;

  if (!user || !user.passwordHash) {
    return userSuccess({ message: GENERIC_REQUEST_MESSAGE });
  }

  try {
    const { plainToken } = await createPasswordResetToken(user.id);
    const actionLink = buildAppUrl(
      `/passwort-zuruecksetzen?token=${encodeURIComponent(plainToken)}`,
    );

    const mailTemplate = await buildPasswordResetMail(actionLink);

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
      message: "Passwort-Reset konnte nicht angefordert werden.",
    });
  }
}

/**
 * Setzt ein neues Passwort anhand eines gültigen Reset-Tokens.
 */
export async function confirmPasswordReset(input: {
  token: string;
  password: string;
}): Promise<UserServiceResult<AuthActionResult>> {
  const token = input.token.trim();
  const passwordError = validatePasswordStrength(input.password);

  if (!token) {
    return userFailure({
      code: "VALIDATION_ERROR",
      message: "Reset-Link ist ungültig.",
    });
  }

  if (passwordError) {
    return userFailure({
      code: "VALIDATION_ERROR",
      message: passwordError,
    });
  }

  const tokenHash = hashPlainToken(token);

  try {
    const storedToken = await prisma.passwordResetToken.findFirst({
      where: { tokenHash, usedAt: null },
      include: { user: true },
    });

    const tokenValid =
      storedToken &&
      verifyPlainTokenHash(token, storedToken.tokenHash) &&
      !isTokenExpired(storedToken.expiresAt);

    if (!tokenValid || !storedToken) {
      return userFailure({
        code: "VALIDATION_ERROR",
        message: INVALID_TOKEN_MESSAGE,
      });
    }

    const passwordHash = await hashPassword(input.password);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: storedToken.userId },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: storedToken.id },
        data: { usedAt: new Date() },
      }),
      prisma.passwordResetToken.deleteMany({
        where: {
          userId: storedToken.userId,
          id: { not: storedToken.id },
        },
      }),
    ]);

    return userSuccess({
      message: "Dein Passwort wurde erfolgreich geändert. Du kannst dich jetzt anmelden.",
    });
  } catch {
    return userFailure({
      code: "INTERNAL_ERROR",
      message: "Passwort konnte nicht geändert werden.",
    });
  }
}
