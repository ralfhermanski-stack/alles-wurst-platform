/**
 * @file auth-client.ts
 * @purpose Browser-Client für Registrierung, Login und Session.
 */

import type { UserProfileInput } from "@/lib/users/user-types";
import type { UserErrorCode } from "@/lib/users/user-errors";

import type { AuthSessionUser } from "./auth-types";
import type { AuthActionResult, RegisterApiData } from "./auth-action-types";

type AuthApiError = {
  code: UserErrorCode;
  message: string;
  details?: Record<string, string>;
};

type AuthApiSuccess<T> = { success: true; data: T };
type AuthApiFailure = { success: false; error: AuthApiError };
export type AuthApiResponse<T> = AuthApiSuccess<T> | AuthApiFailure;

async function authRequest<T>(
  url: string,
  options?: RequestInit,
): Promise<AuthApiResponse<T>> {
  try {
    const response = await fetch(url, {
      ...options,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    const json: unknown = await response.json();

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
      return { success: false, error: json.error as AuthApiError };
    }

    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Unerwartete Server-Antwort.",
      },
    };
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

export type RegisterApiInput = {
  email: string;
  password: string;
  profile: UserProfileInput;
  recipeUserId?: string;
  inviteToken?: string;
};

export async function registerApi(
  input: RegisterApiInput,
): Promise<AuthApiResponse<RegisterApiData>> {
  return authRequest<RegisterApiData>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function loginApi(input: {
  email: string;
  password: string;
  recipeUserId?: string;
}): Promise<AuthApiResponse<AuthSessionUser>> {
  return authRequest<AuthSessionUser>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function logoutApi(): Promise<AuthApiResponse<{ loggedOut: true }>> {
  return authRequest<{ loggedOut: true }>("/api/auth/logout", {
    method: "POST",
  });
}

export async function fetchSessionApi(): Promise<
  AuthApiResponse<AuthSessionUser | null>
> {
  return authRequest<AuthSessionUser | null>("/api/auth/session");
}

export async function requestEmailVerificationApi(input: {
  email?: string;
}): Promise<AuthApiResponse<AuthActionResult>> {
  return authRequest<AuthActionResult>("/api/auth/verify-email/request", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function confirmEmailVerificationApi(
  token: string,
): Promise<AuthApiResponse<{ message: string; userId: string }>> {
  return authRequest<{ message: string; userId: string }>(
    "/api/auth/verify-email/confirm",
    {
      method: "POST",
      body: JSON.stringify({ token }),
    },
  );
}

export async function requestPasswordResetApi(
  email: string,
): Promise<AuthApiResponse<AuthActionResult>> {
  return authRequest<AuthActionResult>("/api/auth/password-reset/request", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function confirmPasswordResetApi(input: {
  token: string;
  password: string;
}): Promise<AuthApiResponse<AuthActionResult>> {
  return authRequest<AuthActionResult>("/api/auth/password-reset/confirm", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function changePasswordApi(input: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}): Promise<AuthApiResponse<AuthActionResult>> {
  return authRequest<AuthActionResult>("/api/auth/password/change", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
