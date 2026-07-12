/**
 * @file marinade-client.ts
 * @purpose Browser-Client für Marinaden-API.
 */

import type { RecipeStatus, RecipeVisibility } from "@prisma/client";

import {
  MEMBERSHIP_ACCESS_BLOCKED_HEADER,
  MEMBERSHIP_ROLE_HEADER,
  getMembershipRole,
  isMembershipAccessBlocked,
} from "@/lib/membership/membership-session";
import type { RecipeErrorCode } from "./recipe-errors";
import type { MarinadeRecipePayload } from "./marinade-types";
import type { MarinadeRecord } from "./marinade-service";

type ApiError = { code: RecipeErrorCode; message: string; details?: Record<string, string> };
type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: ApiError };

async function apiRequest<T>(
  url: string,
  options?: RequestInit,
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(url, {
      ...options,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        [MEMBERSHIP_ROLE_HEADER]: getMembershipRole(),
        [MEMBERSHIP_ACCESS_BLOCKED_HEADER]: isMembershipAccessBlocked() ? "1" : "0",
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
      "error" in json
    ) {
      return { success: false, error: json.error as ApiError };
    }

    return {
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Unerwartete Server-Antwort." },
    };
  } catch {
    return {
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Netzwerkfehler." },
    };
  }
}

export type ApiMarinade = MarinadeRecord;

export async function fetchMarinadeList(
  userId: string,
): Promise<ApiResponse<ApiMarinade[]>> {
  return apiRequest<ApiMarinade[]>(
    `/api/tools/marinades?userId=${encodeURIComponent(userId)}`,
  );
}

export async function fetchMarinade(
  id: string,
  userId: string,
): Promise<ApiResponse<ApiMarinade>> {
  return apiRequest<ApiMarinade>(
    `/api/tools/marinades/${id}?userId=${encodeURIComponent(userId)}`,
  );
}

export async function createMarinadeApi(input: {
  userId: string;
  name: string;
  category?: string | null;
  description?: string | null;
  payload?: MarinadeRecipePayload;
  status?: RecipeStatus;
  visibility?: RecipeVisibility;
}): Promise<ApiResponse<ApiMarinade>> {
  return apiRequest<ApiMarinade>("/api/tools/marinades", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateMarinadeApi(
  id: string,
  input: {
    userId: string;
    name?: string;
    category?: string | null;
    description?: string | null;
    payload?: MarinadeRecipePayload;
    status?: RecipeStatus;
    visibility?: RecipeVisibility;
  },
): Promise<ApiResponse<ApiMarinade>> {
  return apiRequest<ApiMarinade>(`/api/tools/marinades/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function deleteMarinadeApi(
  id: string,
  userId: string,
): Promise<ApiResponse<{ id: string }>> {
  return apiRequest<{ id: string }>(`/api/tools/marinades/${id}`, {
    method: "DELETE",
    body: JSON.stringify({ userId }),
  });
}

export async function duplicateMarinadeApi(
  id: string,
  userId: string,
): Promise<ApiResponse<ApiMarinade>> {
  return apiRequest<ApiMarinade>(`/api/tools/marinades/${id}/duplicate`, {
    method: "POST",
    body: JSON.stringify({ userId }),
  });
}

export async function generateMarinadePdfApi(
  id: string,
  userId: string,
  creatorName: string,
): Promise<ApiResponse<ApiMarinade>> {
  return apiRequest<ApiMarinade>(`/api/tools/marinades/${id}/pdf`, {
    method: "POST",
    body: JSON.stringify({ userId, creatorName }),
  });
}

export function marinadePdfDownloadUrl(id: string, userId: string): string {
  return `/api/tools/marinades/${id}/pdf?userId=${encodeURIComponent(userId)}`;
}
