/**
 * @file recipe-client.ts
 * @purpose Browser-Client für die Rezept-API (fetch).
 * @responsibility Typisierte HTTP-Aufrufe — keine Prisma-Imports im Client.
 * @usage Importiert von Rezeptgenerator-UI-Komponenten.
 */

import type { RecipeStatus, RecipeVisibility } from "@prisma/client";

import type { RecipePayload } from "./recipe-types";
import type { RecipeErrorCode } from "./recipe-errors";
import type {
  PublicRecipeDetail,
  PublicRecipeSummary,
  RecipeDatabaseTypeFilter,
} from "./recipe-database-service";
import {
  MEMBERSHIP_ACCESS_BLOCKED_HEADER,
  MEMBERSHIP_ROLE_HEADER,
  getMembershipRole,
  isMembershipAccessBlocked,
} from "@/lib/membership/membership-session";

/** API-Fehlerstruktur (entspricht recipe-errors.ts) */
export type ApiRecipeError = {
  code: RecipeErrorCode;
  message: string;
  details?: Record<string, string>;
};

type ApiSuccess<T> = { success: true; data: T };
type ApiFailure = { success: false; error: ApiRecipeError };
export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

/** Rezept-DTO aus der API (serialisiert) */
export type ApiRecipe = {
  id: string;
  userId: string;
  name: string;
  category: string | null;
  description: string | null;
  status: RecipeStatus;
  visibility: RecipeVisibility;
  isRecipeOfMonth: boolean;
  isCourseLinked: boolean;
  isMeisterclubSpecial: boolean;
  totalWeightKg: number | null;
  payload: RecipePayload;
  version: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

/** Kategorie aus dem Admin-Katalog */
export type ApiRecipeCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
  active: boolean;
};

export type { PublicRecipeSummary, PublicRecipeDetail, RecipeDatabaseTypeFilter };

/**
 * Führt einen typisierten API-Request aus.
 *
 * @param url     - Ziel-URL
 * @param options - fetch-Optionen
 */
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
        [MEMBERSHIP_ACCESS_BLOCKED_HEADER]: isMembershipAccessBlocked()
          ? "1"
          : "0",
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
      return { success: false, error: json.error as ApiRecipeError };
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

/** Lädt die eigene Rezeptliste. */
export async function fetchRecipeList(
  userId: string,
): Promise<ApiResponse<ApiRecipe[]>> {
  const params = new URLSearchParams({ userId });

  return apiRequest<ApiRecipe[]>(`/api/tools/recipes?${params.toString()}`);
}

/** Lädt ein einzelnes Rezept. */
export async function fetchRecipe(
  id: string,
  userId: string,
): Promise<ApiResponse<ApiRecipe>> {
  const params = new URLSearchParams({ userId });

  return apiRequest<ApiRecipe>(
    `/api/tools/recipes/${id}?${params.toString()}`,
  );
}

/** Legt ein neues Rezept an. */
export async function createRecipeApi(input: {
  userId: string;
  name: string;
  category?: string | null;
  description?: string | null;
  payload?: RecipePayload;
  status?: RecipeStatus;
  visibility?: RecipeVisibility;
  isRecipeOfMonth?: boolean;
  isCourseLinked?: boolean;
  isMeisterclubSpecial?: boolean;
}): Promise<ApiResponse<ApiRecipe>> {
  return apiRequest<ApiRecipe>("/api/tools/recipes", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

/** Aktualisiert ein Rezept. */
export async function updateRecipeApi(
  id: string,
  input: {
    userId: string;
    name?: string;
    category?: string | null;
    description?: string | null;
    payload?: RecipePayload;
    isRecipeOfMonth?: boolean;
    isCourseLinked?: boolean;
    isMeisterclubSpecial?: boolean;
  },
): Promise<ApiResponse<ApiRecipe>> {
  return apiRequest<ApiRecipe>(`/api/tools/recipes/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

/** Löscht ein Rezept (Soft-Delete). */
export async function deleteRecipeApi(
  id: string,
  userId: string,
): Promise<ApiResponse<{ id: string; deletedAt: string }>> {
  return apiRequest(`/api/tools/recipes/${id}`, {
    method: "DELETE",
    body: JSON.stringify({ userId }),
  });
}

/** Dupliziert ein Rezept. */
export async function duplicateRecipeApi(
  id: string,
  userId: string,
): Promise<ApiResponse<ApiRecipe>> {
  return apiRequest<ApiRecipe>(`/api/tools/recipes/${id}/duplicate`, {
    method: "POST",
    body: JSON.stringify({ userId }),
  });
}

/** Ändert den Rezeptstatus. */
export async function updateRecipeStatusApi(
  id: string,
  userId: string,
  status: RecipeStatus,
): Promise<ApiResponse<ApiRecipe>> {
  return apiRequest<ApiRecipe>(`/api/tools/recipes/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ userId, status }),
  });
}

/** Ändert die Sichtbarkeit. */
export async function updateRecipeVisibilityApi(
  id: string,
  userId: string,
  visibility: RecipeVisibility,
): Promise<ApiResponse<ApiRecipe>> {
  return apiRequest<ApiRecipe>(`/api/tools/recipes/${id}/visibility`, {
    method: "PATCH",
    body: JSON.stringify({ userId, visibility }),
  });
}

/** Lädt aktive Rezeptkategorien aus dem Admin-Katalog. */
export async function fetchRecipeCategories(): Promise<
  ApiResponse<ApiRecipeCategory[]>
> {
  return apiRequest<ApiRecipeCategory[]>("/api/tools/recipes/categories");
}

/** Filter für die öffentliche Rezeptdatenbank */
export type RecipeDatabaseListFilters = {
  category?: string;
  search?: string;
  recipeType?: RecipeDatabaseTypeFilter;
};

/** Listet offizielle Rezepte der Datenbank. */
export async function fetchOfficialRecipeList(
  filters: RecipeDatabaseListFilters = {},
): Promise<ApiResponse<PublicRecipeSummary[]>> {
  const params = new URLSearchParams();

  if (filters.category) {
    params.set("category", filters.category);
  }

  if (filters.search) {
    params.set("search", filters.search);
  }

  if (filters.recipeType && filters.recipeType !== "all") {
    params.set("recipeType", filters.recipeType);
  }

  const query = params.toString();
  const url = query
    ? `/api/tools/recipes/database?${query}`
    : "/api/tools/recipes/database";

  return apiRequest<PublicRecipeSummary[]>(url);
}

/** Lädt ein offizielles Rezept für die Detailseite. */
export async function fetchOfficialRecipe(
  id: string,
): Promise<ApiResponse<PublicRecipeDetail>> {
  return apiRequest<PublicRecipeDetail>(`/api/tools/recipes/database/${id}`);
}

/** Kopiert ein offizielles Rezept in die eigenen Rezepte. */
export async function copyOfficialRecipeApi(
  id: string,
  userId: string,
): Promise<ApiResponse<ApiRecipe>> {
  return apiRequest<ApiRecipe>(`/api/tools/recipes/database/${id}`, {
    method: "POST",
    body: JSON.stringify({ userId }),
  });
}
