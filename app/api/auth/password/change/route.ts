import { prisma } from "@/lib/db/prisma";
import { getSessionUserIdFromRequest } from "@/lib/auth/session";
import {
  jsonFromAuthResult,
  parseJsonBody,
  getStringField,
} from "@/lib/auth/auth-api-utils";
import {
  userFailure,
  userSuccess,
} from "@/lib/users/user-errors";
import { hashPassword, validatePasswordStrength, verifyPassword } from "@/lib/auth/password";

export async function POST(request: Request): Promise<Response> {
  const userId = await getSessionUserIdFromRequest(request);

  if (!userId) {
    return jsonFromAuthResult(
      userFailure({
        code: "FORBIDDEN",
        message: "Anmeldung erforderlich.",
      }),
    );
  }

  const body = await parseJsonBody(request);

  if (!body) {
    return jsonFromAuthResult(
      userFailure({
        code: "VALIDATION_ERROR",
        message: "Ungültiger JSON-Body.",
      }),
    );
  }

  const currentPassword = getStringField(body, "currentPassword")?.trim();
  const newPassword = getStringField(body, "newPassword")?.trim();
  const confirmPassword = getStringField(body, "confirmPassword")?.trim();

  if (!currentPassword || !newPassword || !confirmPassword) {
    return jsonFromAuthResult(
      userFailure({
        code: "VALIDATION_ERROR",
        message: "Pflichtfelder fehlen.",
      }),
    );
  }

  if (newPassword !== confirmPassword) {
    return jsonFromAuthResult(
      userFailure({
        code: "VALIDATION_ERROR",
        message: "Die Passwörter stimmen nicht überein.",
      }),
    );
  }

  const passwordError = validatePasswordStrength(newPassword);

  if (passwordError) {
    return jsonFromAuthResult(
      userFailure({
        code: "VALIDATION_ERROR",
        message: passwordError,
      }),
    );
  }

  const stored = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true },
  });

  if (!stored?.passwordHash) {
    return jsonFromAuthResult(
      userFailure({
        code: "FORBIDDEN",
        message: "Passwort nicht verfügbar. Bitte nutze einen Reset-Link.",
      }),
    );
  }

  const valid = await verifyPassword(currentPassword, stored.passwordHash);

  if (!valid) {
    return jsonFromAuthResult(
      userFailure({
        code: "FORBIDDEN",
        message: "Aktuelles Passwort ist ungültig.",
      }),
    );
  }

  const passwordHash = await hashPassword(newPassword);

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  } catch {
    return jsonFromAuthResult(
      userFailure({
        code: "INTERNAL_ERROR",
        message: "Passwort konnte nicht geändert werden.",
      }),
    );
  }

  return jsonFromAuthResult(
    userSuccess({
      message: "Passwort erfolgreich geändert.",
    }),
  );
}

