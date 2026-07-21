/**
 * @file admin-client.ts
 * @purpose Browser-Client für Admin-APIs des Rezeptgenerators.
 */

import { adminFetch as sessionAdminFetch } from "./admin-fetch";
import type { ModerationAction } from "./admin-labels";
import type { AdminRecipeRecord } from "./admin-recipe-service";
import type { RecipeCategoryRecord } from "./admin-category-service";
import type { RecipeGeneratorSettingsRecord } from "./admin-settings-service";
import type { RecipeErrorCode } from "@/lib/tools/recipe-errors";
import type { RecipePayload } from "@/lib/tools/recipe-types";
import type { RecipeStatus, RecipeVisibility, RecipeModerationStatus } from "@prisma/client";

type ApiRecipeError = {
  code: RecipeErrorCode;
  message: string;
  details?: Record<string, string>;
};

type ApiSuccess<T> = { success: true; data: T };
type ApiFailure = { success: false; error: ApiRecipeError };
type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export type AdminRecipeListFilters = {
  status?: RecipeStatus;
  visibility?: RecipeVisibility;
  userId?: string;
  category?: string;
  moderationStatus?: RecipeModerationStatus;
  recipeKind?: "wurst" | "marinade";
  search?: string;
};

async function adminRequest<T>(
  url: string,
  options?: RequestInit,
): Promise<ApiResponse<T>> {
  const result = await sessionAdminFetch<T>(url, options);

  if (result.success) {
    return { success: true, data: result.data };
  }

  return {
    success: false,
    error: {
      code: result.error.code as RecipeErrorCode,
      message: result.error.message,
    },
  };
}

/** Admin-Rezeptliste mit Filtern */
export async function fetchAdminRecipeList(
  filters: AdminRecipeListFilters = {},
): Promise<ApiResponse<AdminRecipeRecord[]>> {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(filters)) {
    if (value) {
      params.set(key, value);
    }
  }

  const query = params.toString();
  const url = query ? `/api/admin/recipes?${query}` : "/api/admin/recipes";

  return adminRequest<AdminRecipeRecord[]>(url);
}

/** Einzelnes Rezept für Admin */
export async function fetchAdminRecipe(
  id: string,
): Promise<ApiResponse<AdminRecipeRecord>> {
  return adminRequest<AdminRecipeRecord>(`/api/admin/recipes/${id}`);
}

/** Rezept als Admin aktualisieren */
export async function updateAdminRecipeApi(
  id: string,
  input: {
    name?: string;
    category?: string | null;
    description?: string | null;
    payload?: RecipePayload;
    status?: RecipeStatus;
    visibility?: RecipeVisibility;
    adminComment?: string | null;
  },
): Promise<ApiResponse<AdminRecipeRecord>> {
  return adminRequest<AdminRecipeRecord>(`/api/admin/recipes/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

/** Moderationsaktion ausführen */
export async function moderateAdminRecipeApi(
  id: string,
  action: ModerationAction,
  adminComment?: string | null,
): Promise<ApiResponse<AdminRecipeRecord>> {
  return adminRequest<AdminRecipeRecord>(`/api/admin/recipes/${id}/moderation`, {
    method: "PATCH",
    body: JSON.stringify({ action, adminComment }),
  });
}

/** Kategorien laden (Admin) */
export async function fetchAdminCategories(): Promise<
  ApiResponse<RecipeCategoryRecord[]>
> {
  return adminRequest<RecipeCategoryRecord[]>("/api/admin/categories");
}

/** Kategorie anlegen */
export async function createAdminCategoryApi(input: {
  name: string;
  slug?: string;
  description?: string | null;
  sortOrder?: number;
  active?: boolean;
}): Promise<ApiResponse<RecipeCategoryRecord>> {
  return adminRequest<RecipeCategoryRecord>("/api/admin/categories", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

/** Kategorie aktualisieren */
export async function updateAdminCategoryApi(
  id: string,
  input: {
    name?: string;
    slug?: string;
    description?: string | null;
    sortOrder?: number;
    active?: boolean;
  },
): Promise<ApiResponse<RecipeCategoryRecord>> {
  return adminRequest<RecipeCategoryRecord>(`/api/admin/categories/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

/** Kategorie löschen */
export async function deleteAdminCategoryApi(
  id: string,
): Promise<ApiResponse<{ id: string }>> {
  return adminRequest<{ id: string }>(`/api/admin/categories/${id}`, {
    method: "DELETE",
  });
}

/** PDF-/Generator-Einstellungen laden */
export async function fetchAdminRecipeSettings(): Promise<
  ApiResponse<RecipeGeneratorSettingsRecord>
> {
  return adminRequest<RecipeGeneratorSettingsRecord>(
    "/api/admin/settings/recipe-generator",
  );
}

/** PDF-/Generator-Einstellungen speichern */
export async function updateAdminRecipeSettingsApi(input: {
  pdfHeaderText?: string;
  pdfFooterText?: string;
  pdfLogoPlaceholder?: string;
  pdfLegalNotice?: string;
}): Promise<ApiResponse<RecipeGeneratorSettingsRecord>> {
  return adminRequest<RecipeGeneratorSettingsRecord>(
    "/api/admin/settings/recipe-generator",
    {
      method: "PATCH",
      body: JSON.stringify(input),
    },
  );
}

/** PDF-Logo hochladen (multipart/form-data, Feld: file) */
export async function uploadAdminRecipePdfLogoApi(
  file: File,
): Promise<ApiResponse<RecipeGeneratorSettingsRecord>> {
  const formData = new FormData();
  formData.set("file", file);

  return adminRequest<RecipeGeneratorSettingsRecord>(
    "/api/admin/settings/recipe-generator/logo",
    {
      method: "POST",
      body: formData,
    },
  );
}

/** PDF-Logo entfernen */
export async function removeAdminRecipePdfLogoApi(): Promise<
  ApiResponse<RecipeGeneratorSettingsRecord>
> {
  return adminRequest<RecipeGeneratorSettingsRecord>(
    "/api/admin/settings/recipe-generator/logo",
    {
      method: "DELETE",
    },
  );
}

/** Prüft, ob der Admin-Token vom Server akzeptiert wird */
export async function verifyAdminTokenApi(): Promise<ApiResponse<{ ok: true }>> {
  return adminRequest<{ ok: true }>("/api/admin/session");
}

/** Rezeptbild als Admin hochladen (multipart/form-data) */
export async function uploadAdminRecipeImageApi(
  id: string,
  formData: FormData,
): Promise<ApiResponse<AdminRecipeRecord>> {
  return adminRequest<AdminRecipeRecord>(`/api/admin/recipes/${id}/image`, {
    method: "POST",
    body: formData,
  });
}
