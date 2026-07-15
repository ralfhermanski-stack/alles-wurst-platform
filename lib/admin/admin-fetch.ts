/**
 * @file admin-fetch.ts
 * @purpose Gemeinsamer Fetch für Admin-APIs (Session-Cookie).
 */

import type { UserErrorCode } from "@/lib/users/user-errors";

type AdminApiError = {
  code: UserErrorCode | string;
  message: string;
};

type ApiSuccess<T> = { success: true; data: T };
type ApiFailure = { success: false; error: AdminApiError };
export type AdminApiResponse<T> = ApiSuccess<T> | ApiFailure;

export async function adminFetch<T>(
  url: string,
  options?: RequestInit,
): Promise<AdminApiResponse<T>> {
  const isFormData = options?.body instanceof FormData;

  try {
    const response = await fetch(url, {
      ...options,
      credentials: "include",
      headers: {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...options?.headers,
      },
    });

    if (response.status === 413) {
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Die Datei ist zu groß für den Server (max. 5 MB).",
        },
      };
    }

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

    const json = JSON.parse(text) as unknown;

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
        error: json.error as AdminApiError,
      };
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
