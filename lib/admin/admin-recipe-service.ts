/**
 * @file admin-recipe-service.ts
 * @purpose Admin-CRUD und Moderation für Rezepte.
 */

import {
  Prisma,
  RecipeKind,
  type Recipe,
  RecipeModerationStatus,
  RecipePdfStatus,
  RecipeStatus,
  RecipeVisibility,
} from "@prisma/client";

import type { ModerationAction } from "./admin-labels";
import { prisma } from "@/lib/db/prisma";
import {
  recipeFailure,
  recipeSuccess,
  type RecipeServiceResult,
} from "@/lib/tools/recipe-errors";
import {
  getDefaultRecipePayload,
  isValidUuid,
  validateRecipePayloadForSave,
} from "@/lib/tools/recipe-payload-validator";
import {
  mapRecipeToRecord,
  type RecipeRecord,
} from "@/lib/tools/recipe-service";
import type { RecipePayload } from "@/lib/tools/recipe-types";
import {
  sumBinderPercent,
  sumMeatPercent,
} from "@/lib/tools/recipe-calculator";

/** Rezept mit Admin-Moderationsfeldern */
export type AdminRecipeRecord = RecipeRecord & {
  moderationStatus: RecipeModerationStatus;
  adminComment: string | null;
  moderationReviewedAt: string | null;
  isOfficialDatabase: boolean;
  blockedAt: string | null;
  recipeKind: RecipeKind;
  pdfStatus: RecipePdfStatus;
  pdfGeneratedAt: string | null;
  pdfVersion: number | null;
};

/** Filter für die Admin-Rezeptliste */
export type ListAdminRecipesInput = {
  status?: RecipeStatus;
  visibility?: RecipeVisibility;
  userId?: string;
  category?: string;
  moderationStatus?: RecipeModerationStatus;
  recipeKind?: RecipeKind;
  search?: string;
  includeDeleted?: boolean;
};

/** Admin-Update-Eingabe */
export type AdminUpdateRecipeInput = {
  name?: string;
  category?: string | null;
  description?: string | null;
  payload?: RecipePayload;
  status?: RecipeStatus;
  visibility?: RecipeVisibility;
  adminComment?: string | null;
};

function handlePrismaError(error: unknown): RecipeServiceResult<never> {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2025") {
      return recipeFailure({
        code: "NOT_FOUND",
        message: "Das Rezept wurde nicht gefunden.",
      });
    }
  }

  console.error("[admin-recipe-service] Unerwarteter Datenbankfehler:", error);

  return recipeFailure({
    code: "INTERNAL_ERROR",
    message: "Ein interner Fehler ist aufgetreten. Bitte später erneut versuchen.",
  });
}

function preparePayloadForStorage(payload: RecipePayload): {
  payload: RecipePayload;
  totalWeightKg: number | null;
} {
  const enriched: RecipePayload = {
    ...payload,
    calculation: {
      ...payload.calculation,
      meatSharePercent: sumMeatPercent(payload.meats),
      binderSharePercent: sumBinderPercent(payload.binders),
    },
  };

  const totalWeightKg =
    enriched.calculation.totalWeightKg > 0
      ? enriched.calculation.totalWeightKg
      : null;

  return { payload: enriched, totalWeightKg };
}

function resolvePublishedAt(
  status: RecipeStatus,
  visibility: RecipeVisibility,
  existing: Date | null,
): Date | null {
  if (
    status === RecipeStatus.published ||
    visibility === RecipeVisibility.database
  ) {
    return existing ?? new Date();
  }

  return existing;
}

/**
 * Mappt eine Prisma-Zeile in ein Admin-Rezept-DTO.
 */
export function mapRecipeToAdminRecord(recipe: Recipe): AdminRecipeRecord {
  const base = mapRecipeToRecord(recipe);

  return {
    ...base,
    moderationStatus: recipe.moderationStatus,
    adminComment: recipe.adminComment,
    moderationReviewedAt:
      recipe.moderationReviewedAt?.toISOString() ?? null,
    isOfficialDatabase: recipe.isOfficialDatabase,
    blockedAt: recipe.blockedAt?.toISOString() ?? null,
    recipeKind: recipe.recipeKind,
    pdfStatus: recipe.pdfStatus,
    pdfGeneratedAt: recipe.pdfGeneratedAt?.toISOString() ?? null,
    pdfVersion: recipe.pdfVersion,
  };
}

/**
 * Listet alle Rezepte für den Admin mit optionalen Filtern.
 */
export async function listAdminRecipes(
  input: ListAdminRecipesInput,
): Promise<RecipeServiceResult<AdminRecipeRecord[]>> {
  try {
    const where: Prisma.RecipeWhereInput = {};

    if (!input.includeDeleted) {
      where.deletedAt = null;
    }

    if (input.status) {
      where.status = input.status;
    }

    if (input.visibility) {
      where.visibility = input.visibility;
    }

    if (input.userId) {
      if (!isValidUuid(input.userId)) {
        return recipeFailure({
          code: "VALIDATION_ERROR",
          message: "Die userId muss eine gültige UUID sein.",
        });
      }

      where.userId = input.userId;
    }

    if (input.category) {
      where.category = { equals: input.category, mode: "insensitive" };
    }

    if (input.moderationStatus) {
      where.moderationStatus = input.moderationStatus;
    }

    if (input.recipeKind) {
      where.recipeKind = input.recipeKind;
    }

    if (input.search?.trim()) {
      const term = input.search.trim();
      where.OR = [
        { name: { contains: term, mode: "insensitive" } },
        { description: { contains: term, mode: "insensitive" } },
      ];
    }

    const recipes = await prisma.recipe.findMany({
      where,
      orderBy: { updatedAt: "desc" },
    });

    return recipeSuccess(recipes.map(mapRecipeToAdminRecord));
  } catch (error) {
    return handlePrismaError(error);
  }
}

/**
 * Lädt ein einzelnes Rezept für den Admin (ohne Besitzerprüfung).
 */
export async function getAdminRecipeById(
  recipeId: string,
): Promise<RecipeServiceResult<AdminRecipeRecord>> {
  if (!isValidUuid(recipeId)) {
    return recipeFailure({
      code: "VALIDATION_ERROR",
      message: "Die Rezept-ID muss eine gültige UUID sein.",
    });
  }

  try {
    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
    });

    if (!recipe) {
      return recipeFailure({
        code: "NOT_FOUND",
        message: "Das Rezept wurde nicht gefunden.",
      });
    }

    return recipeSuccess(mapRecipeToAdminRecord(recipe));
  } catch (error) {
    return handlePrismaError(error);
  }
}

/**
 * Aktualisiert ein Rezept im Adminmodus (ohne Besitzerprüfung).
 */
export async function updateAdminRecipe(
  recipeId: string,
  input: AdminUpdateRecipeInput,
): Promise<RecipeServiceResult<AdminRecipeRecord>> {
  if (!isValidUuid(recipeId)) {
    return recipeFailure({
      code: "VALIDATION_ERROR",
      message: "Die Rezept-ID muss eine gültige UUID sein.",
    });
  }

  try {
    const existing = await prisma.recipe.findUnique({
      where: { id: recipeId },
    });

    if (!existing) {
      return recipeFailure({
        code: "NOT_FOUND",
        message: "Das Rezept wurde nicht gefunden.",
      });
    }

    const data: Prisma.RecipeUpdateInput = {};
    let incrementVersion = false;

    if (input.name !== undefined) {
      const trimmed = input.name.trim();

      if (!trimmed) {
        return recipeFailure({
          code: "VALIDATION_ERROR",
          message: "Der Rezeptname ist erforderlich.",
        });
      }

      data.name = trimmed;
      incrementVersion = true;
    }

    if (input.category !== undefined) {
      data.category = input.category;
      incrementVersion = true;
    }

    if (input.description !== undefined) {
      data.description = input.description;
      incrementVersion = true;
    }

    if (input.payload !== undefined) {
      const payloadValidation = validateRecipePayloadForSave(input.payload);

      if (!payloadValidation.success) {
        return payloadValidation;
      }

      const prepared = preparePayloadForStorage(payloadValidation.data);
      data.payload = prepared.payload as Prisma.InputJsonValue;
      data.totalWeightKg = prepared.totalWeightKg;
      incrementVersion = true;
    }

    if (input.status !== undefined) {
      data.status = input.status;
      data.publishedAt = resolvePublishedAt(
        input.status,
        input.visibility ?? existing.visibility,
        existing.publishedAt,
      );
    }

    if (input.visibility !== undefined) {
      data.visibility = input.visibility;
      data.publishedAt = resolvePublishedAt(
        input.status ?? existing.status,
        input.visibility,
        existing.publishedAt,
      );
    }

    if (input.adminComment !== undefined) {
      data.adminComment = input.adminComment;
    }

    if (incrementVersion) {
      data.version = { increment: 1 };
    }

    const recipe = await prisma.recipe.update({
      where: { id: recipeId },
      data,
    });

    return recipeSuccess(mapRecipeToAdminRecord(recipe));
  } catch (error) {
    return handlePrismaError(error);
  }
}

/**
 * Speichert Bild-Referenzen eines Rezepts (Admin, ohne Besitzerprüfung).
 */
export async function updateAdminRecipeImage(
  recipeId: string,
  imageStorageKey: string,
  imageFileName: string,
): Promise<RecipeServiceResult<AdminRecipeRecord>> {
  if (!isValidUuid(recipeId)) {
    return recipeFailure({
      code: "VALIDATION_ERROR",
      message: "Die Rezept-ID muss eine gültige UUID sein.",
    });
  }

  try {
    const recipe = await prisma.recipe.update({
      where: { id: recipeId },
      data: { imageStorageKey, imageFileName },
    });

    return recipeSuccess(mapRecipeToAdminRecord(recipe));
  } catch (error) {
    return handlePrismaError(error);
  }
}

/**
 * Liefert den Bild-Speicherschlüssel eines Rezepts.
 */
export async function getRecipeImageStorageKey(
  recipeId: string,
): Promise<string | null> {
  if (!isValidUuid(recipeId)) {
    return null;
  }

  const recipe = await prisma.recipe.findUnique({
    where: { id: recipeId },
    select: { imageStorageKey: true },
  });

  return recipe?.imageStorageKey ?? null;
}

/**
 * Führt eine Moderationsaktion auf einem Rezept aus.
 */
export async function moderateAdminRecipe(
  recipeId: string,
  action: ModerationAction,
  adminComment?: string | null,
): Promise<RecipeServiceResult<AdminRecipeRecord>> {
  if (!isValidUuid(recipeId)) {
    return recipeFailure({
      code: "VALIDATION_ERROR",
      message: "Die Rezept-ID muss eine gültige UUID sein.",
    });
  }

  const allowedActions: ModerationAction[] = [
    "approve",
    "reject",
    "block",
    "adopt",
    "reset",
  ];

  if (!allowedActions.includes(action)) {
    return recipeFailure({
      code: "VALIDATION_ERROR",
      message: "Ungültige Moderationsaktion.",
    });
  }

  try {
    const existing = await prisma.recipe.findUnique({
      where: { id: recipeId },
    });

    if (!existing) {
      return recipeFailure({
        code: "NOT_FOUND",
        message: "Das Rezept wurde nicht gefunden.",
      });
    }

    const now = new Date();
    const data: Prisma.RecipeUpdateInput = {
      moderationReviewedAt: now,
    };

    if (adminComment !== undefined) {
      data.adminComment = adminComment;
    }

    switch (action) {
      case "approve":
        data.moderationStatus = RecipeModerationStatus.approved;
        data.status = RecipeStatus.published;
        data.visibility = RecipeVisibility.database;
        data.source = "PREMIUM_DATABASE";
        data.publishedAt = resolvePublishedAt(
          RecipeStatus.published,
          RecipeVisibility.database,
          existing.publishedAt,
        );
        data.blockedAt = null;
        break;

      case "reject":
        data.moderationStatus = RecipeModerationStatus.rejected;
        data.visibility = RecipeVisibility.private;
        data.blockedAt = null;
        break;

      case "block":
        data.moderationStatus = RecipeModerationStatus.blocked;
        data.visibility = RecipeVisibility.private;
        data.status = RecipeStatus.draft;
        data.blockedAt = now;
        break;

      case "adopt":
        data.moderationStatus = RecipeModerationStatus.approved;
        data.isOfficialDatabase = true;
        data.source = "PREMIUM_DATABASE";
        data.status = RecipeStatus.published;
        data.visibility = RecipeVisibility.database;
        data.publishedAt = resolvePublishedAt(
          RecipeStatus.published,
          RecipeVisibility.database,
          existing.publishedAt,
        );
        data.blockedAt = null;
        break;

      case "reset":
        data.moderationStatus = RecipeModerationStatus.pending;
        data.blockedAt = null;
        data.isOfficialDatabase = false;
        break;
    }

    const recipe = await prisma.recipe.update({
      where: { id: recipeId },
      data,
    });

    return recipeSuccess(mapRecipeToAdminRecord(recipe));
  } catch (error) {
    return handlePrismaError(error);
  }
}

/**
 * Stellt sicher, dass ein Rezept-Payload für Admin-Anzeige verfügbar ist.
 */
export function ensureRecipePayload(recipe: AdminRecipeRecord): RecipePayload {
  return recipe.payload ?? getDefaultRecipePayload();
}
