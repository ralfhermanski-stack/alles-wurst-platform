import { getSessionUserIdFromRequest } from "@/lib/auth/session";
import { jsonFromAuthResult } from "@/lib/auth/auth-api-utils";
import { prisma } from "@/lib/db/prisma";
import { userFailure, userSuccess } from "@/lib/users/user-errors";
import {
  buildPublicAvatarUrl,
  isAllowedAvatarFile,
  saveUserAvatar,
} from "@/lib/users/user-avatar-storage";
import {
  MAX_AVATAR_BYTES,
  MAX_AVATAR_SIZE_LABEL,
} from "@/lib/users/user-avatar-limits";

/**
 * POST /api/users/me/avatar — Profilbild hochladen.
 */
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

  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return jsonFromAuthResult(
      userFailure({
        code: "VALIDATION_ERROR",
        message: "Ungültige Upload-Daten.",
      }),
    );
  }

  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return jsonFromAuthResult(
      userFailure({
        code: "VALIDATION_ERROR",
        message: "Bilddatei ist erforderlich.",
      }),
    );
  }

  if (!isAllowedAvatarFile(file.name, file.type)) {
    return jsonFromAuthResult(
      userFailure({
        code: "VALIDATION_ERROR",
        message: "Nur JPG, PNG oder WebP sind erlaubt.",
      }),
    );
  }

  if (file.size > MAX_AVATAR_BYTES) {
    return jsonFromAuthResult(
      userFailure({
        code: "VALIDATION_ERROR",
        message: `Avatar ist zu groß (max. ${MAX_AVATAR_SIZE_LABEL}).`,
      }),
    );
  }

  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const saved = await saveUserAvatar(userId, file.name, bytes);
    const avatarUrl = buildPublicAvatarUrl(userId);

    await prisma.userProfile.update({
      where: { userId },
      data: {
        avatarStorageKey: saved.storageKey,
        avatarFileName: saved.fileName,
        avatarUrl,
      },
    });

    return jsonFromAuthResult(
      userSuccess({
        avatarUrl,
        avatarFileName: saved.fileName,
      }),
    );
  } catch (error) {
    const message =
      error instanceof Error && error.message.includes("zu groß")
        ? error.message
        : "Avatar konnte nicht hochgeladen werden.";

    return jsonFromAuthResult(
      userFailure({
        code: "INTERNAL_ERROR",
        message,
      }),
    );
  }
}

/**
 * DELETE /api/users/me/avatar — Hochgeladenes Profilbild entfernen.
 */
export async function DELETE(request: Request): Promise<Response> {
  const userId = await getSessionUserIdFromRequest(request);

  if (!userId) {
    return jsonFromAuthResult(
      userFailure({
        code: "FORBIDDEN",
        message: "Anmeldung erforderlich.",
      }),
    );
  }

  try {
    await prisma.userProfile.update({
      where: { userId },
      data: {
        avatarStorageKey: null,
        avatarFileName: null,
        avatarUrl: null,
      },
    });

    return jsonFromAuthResult(userSuccess({ removed: true }));
  } catch {
    return jsonFromAuthResult(
      userFailure({
        code: "INTERNAL_ERROR",
        message: "Avatar konnte nicht entfernt werden.",
      }),
    );
  }
}
