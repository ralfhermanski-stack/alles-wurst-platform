/**
 * @file user-profile-client.ts
 * @purpose Client für Benutzerprofil (für den angemeldeten Nutzer).
 */

"use client";

import type { UserProfileInput } from "@/lib/users/user-types";
import type { UserErrorCode } from "@/lib/users/user-errors";

type ApiSuccess<T> = { success: true; data: T };
type ApiFailure = {
  success: false;
  error: { code: UserErrorCode; message: string };
};

type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

async function parseApiResponse<T>(response: Response): Promise<ApiResponse<T>> {
  const text = await response.text();

  if (!text.trim()) {
    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: `Server antwortete ohne Inhalt (HTTP ${response.status}).`,
      },
    };
  }

  let json: unknown;

  try {
    json = JSON.parse(text) as unknown;
  } catch {
    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Ungültige Server-Antwort.",
      },
    };
  }

  if (
    typeof json === "object" &&
    json !== null &&
    "success" in json &&
    json.success === true &&
    "data" in json
  ) {
    return { success: true, data: json.data as T };
  }

  if (
    typeof json === "object" &&
    json !== null &&
    "success" in json &&
    json.success === false &&
    "error" in json &&
    typeof json.error === "object" &&
    json.error !== null
  ) {
    return {
      success: false,
      error: json.error as ApiFailure["error"],
    };
  }

  return {
    success: false,
    error: {
      code: "INTERNAL_ERROR",
      message: "Unerwartete Server-Antwort.",
    },
  };
}

async function profileRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(path, {
      ...init,
      credentials: "include",
      headers: {
        ...(init?.body instanceof FormData
          ? init.headers
          : { "Content-Type": "application/json" }),
        ...init?.headers,
      },
    });

    return parseApiResponse<T>(response);
  } catch {
    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Netzwerkfehler — bitte Verbindung prüfen.",
      },
    };
  }
}

export type MyProfileResponse = UserProfileInput & {
  avatarFileName?: string | null;
};

export type AvatarUploadResponse = {
  avatarUrl: string;
  avatarFileName: string;
};

export async function fetchMyProfileApi(): Promise<ApiResponse<MyProfileResponse>> {
  return profileRequest<MyProfileResponse>("/api/users/me/profile");
}

export async function updateMyProfileApi(
  profile: UserProfileInput,
): Promise<ApiResponse<MyProfileResponse>> {
  return profileRequest<MyProfileResponse>("/api/users/me/profile", {
    method: "PATCH",
    body: JSON.stringify(profile),
  });
}

export async function uploadMyAvatarApi(
  file: File,
): Promise<ApiResponse<AvatarUploadResponse>> {
  const formData = new FormData();
  formData.append("file", file);

  return profileRequest<AvatarUploadResponse>("/api/users/me/avatar", {
    method: "POST",
    body: formData,
  });
}

export async function removeMyAvatarApi(): Promise<
  ApiResponse<{ removed: boolean }>
> {
  return profileRequest<{ removed: boolean }>("/api/users/me/avatar", {
    method: "DELETE",
  });
}
