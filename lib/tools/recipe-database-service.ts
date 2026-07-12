/**
 * @file recipe-database-service.ts
 * @purpose Öffentliche Rezeptdatenbank — nur offizielle, freigegebene Rezepte.
 */

import {
  Prisma,
  RecipeModerationStatus,
  RecipeStatus,
  RecipeVisibility,
  type Recipe,
} from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import {
  checkMembershipCapability,
  type MembershipAccessContext,
} from "@/lib/membership/membership-rules";
import { guardMembershipCheck } from "@/lib/membership/membership-guard";
import {
  recipeFailure,
  recipeSuccess,
  type RecipeServiceResult,
} from "@/lib/tools/recipe-errors";
import {
  getDefaultRecipePayload,
  isValidUuid,
  parseRecipePayload,
} from "@/lib/tools/recipe-payload-validator";
import { countUserRecipes, mapRecipeToRecord } from "@/lib/tools/recipe-service";
import { canCreateOwnRecipe } from "@/lib/membership/membership-rules";
import type { RecipePayload } from "@/lib/tools/recipe-types";

/** Filter für Rezepttyp (abgeleitet aus dem Payload) */
export type RecipeDatabaseTypeFilter = "all" | "smoked" | "fresh";

/** Filter für die öffentliche Rezeptliste */
export type ListOfficialRecipesInput = {
  category?: string;
  search?: string;
  recipeType?: RecipeDatabaseTypeFilter;
  membership?: MembershipAccessContext;
};

/** Kurzdarstellung für die Rezeptdatenbank-Liste */
export type PublicRecipeSummary = {
  id: string;
  name: string;
  category: string | null;
  description: string | null;
  totalWeightKg: number | null;
  version: number;
  publishedAt: string | null;
  recipeType: "smoked" | "fresh";
  meatLineCount: number;
  ingredientCount: number;
};

/** Vollständige öffentliche Detailansicht */
export type PublicRecipeDetail = PublicRecipeSummary & {
  payload: RecipePayload;
};

const OFFICIAL_RECIPE_WHERE: Prisma.RecipeWhereInput = {
  deletedAt: null,
  moderationStatus: RecipeModerationStatus.approved,
  visibility: RecipeVisibility.database,
  isOfficialDatabase: true,
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

  console.error("[recipe-database-service] Unerwarteter Datenbankfehler:", error);

  return recipeFailure({
    code: "INTERNAL_ERROR",
    message: "Ein interner Fehler ist aufgetreten. Bitte später erneut versuchen.",
  });
}

/**
 * Leitet den Rezepttyp aus dem Payload ab (Räucherware vs. Frischware).
 */
export function deriveRecipeType(payload: RecipePayload): "smoked" | "fresh" {
  const smoking = payload.smoking;
  const hasSmoking =
    (smoking?.phases?.length ?? 0) > 0 ||
    Boolean(smoking?.notes?.trim());

  return hasSmoking ? "smoked" : "fresh";
}

function mapToPublicSummary(recipe: Recipe): PublicRecipeSummary {
  const payload = parseRecipePayload(recipe.payload) ?? getDefaultRecipePayload();

  return {
    id: recipe.id,
    name: recipe.name,
    category: recipe.category,
    description: recipe.description,
    totalWeightKg:
      recipe.totalWeightKg !== null ? Number(recipe.totalWeightKg) : null,
    version: recipe.version,
    publishedAt: recipe.publishedAt?.toISOString() ?? null,
    recipeType: deriveRecipeType(payload),
    meatLineCount: payload.meats.length,
    ingredientCount: payload.ingredients.length,
  };
}

function matchesRecipeTypeFilter(
  recipeType: "smoked" | "fresh",
  filter: RecipeDatabaseTypeFilter | undefined,
): boolean {
  if (!filter || filter === "all") {
    return true;
  }

  return recipeType === filter;
}

/**
 * Prüft, ob eine Rezeptzeile in der öffentlichen Datenbank sichtbar sein darf.
 */
export function isOfficialPublicRecipe(recipe: Recipe): boolean {
  return (
    recipe.deletedAt === null &&
    recipe.moderationStatus === RecipeModerationStatus.approved &&
    recipe.visibility === RecipeVisibility.database &&
    recipe.isOfficialDatabase
  );
}

/**
 * Listet offizielle Rezepte für die öffentliche Datenbank.
 */
export async function listOfficialRecipes(
  input: ListOfficialRecipesInput = {},
): Promise<RecipeServiceResult<PublicRecipeSummary[]>> {
  if (input.membership) {
    const readCheck = checkMembershipCapability(
      input.membership,
      "recipe.database.read",
    );
    const guard = guardMembershipCheck(readCheck);

    if (guard) {
      return guard;
    }
  }

  try {
    const where: Prisma.RecipeWhereInput = {
      ...OFFICIAL_RECIPE_WHERE,
    };

    if (input.category?.trim()) {
      where.category = {
        equals: input.category.trim(),
        mode: "insensitive",
      };
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
      orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
    });

    const summaries = recipes
      .map(mapToPublicSummary)
      .filter((summary) =>
        matchesRecipeTypeFilter(summary.recipeType, input.recipeType),
      );

    return recipeSuccess(summaries);
  } catch (error) {
    return handlePrismaError(error);
  }
}

/**
 * Lädt ein offizielles Rezept für die Detailseite.
 */
export async function getOfficialRecipeById(
  recipeId: string,
  membership?: MembershipAccessContext,
): Promise<RecipeServiceResult<PublicRecipeDetail>> {
  if (membership) {
    const readCheck = checkMembershipCapability(
      membership,
      "recipe.database.read",
    );
    const guard = guardMembershipCheck(readCheck);

    if (guard) {
      return guard;
    }
  }

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

    if (!recipe || !isOfficialPublicRecipe(recipe)) {
      return recipeFailure({
        code: "NOT_FOUND",
        message: "Das Rezept ist nicht in der offiziellen Datenbank verfügbar.",
      });
    }

    const summary = mapToPublicSummary(recipe);
    const payload =
      parseRecipePayload(recipe.payload) ?? getDefaultRecipePayload();

    return recipeSuccess({
      ...summary,
      payload,
    });
  } catch (error) {
    return handlePrismaError(error);
  }
}

/**
 * Kopiert ein offizielles Rezept in die Rezepte des anfragenden Nutzers.
 */
export async function copyOfficialRecipeToUser(
  recipeId: string,
  userId: string,
  membership?: MembershipAccessContext,
): Promise<RecipeServiceResult<ReturnType<typeof mapRecipeToRecord>>> {
  if (membership) {
    const copyCheck = checkMembershipCapability(
      membership,
      "recipe.database.copy",
    );
    const copyGuard = guardMembershipCheck(copyCheck);

    if (copyGuard) {
      return copyGuard;
    }

    const currentCount = await countUserRecipes(userId);
    const createCheck = canCreateOwnRecipe(membership, currentCount);
    const createGuard = guardMembershipCheck(createCheck);

    if (createGuard) {
      return createGuard;
    }
  }

  if (!isValidUuid(recipeId)) {
    return recipeFailure({
      code: "VALIDATION_ERROR",
      message: "Die Rezept-ID muss eine gültige UUID sein.",
    });
  }

  if (!isValidUuid(userId)) {
    return recipeFailure({
      code: "VALIDATION_ERROR",
      message: "Die userId muss eine gültige UUID sein.",
    });
  }

  try {
    const source = await prisma.recipe.findUnique({
      where: { id: recipeId },
    });

    if (!source || !isOfficialPublicRecipe(source)) {
      return recipeFailure({
        code: "NOT_FOUND",
        message: "Das Rezept kann nicht kopiert werden.",
      });
    }

    const sourcePayload =
      parseRecipePayload(source.payload) ?? getDefaultRecipePayload();

    const copy = await prisma.recipe.create({
      data: {
        userId,
        name: `${source.name} (Kopie)`,
        category: source.category,
        description: source.description,
        status: RecipeStatus.draft,
        visibility: RecipeVisibility.private,
        moderationStatus: RecipeModerationStatus.none,
        isOfficialDatabase: false,
        totalWeightKg: source.totalWeightKg,
        payload: sourcePayload as Prisma.InputJsonValue,
        version: 1,
        publishedAt: null,
        adminComment: null,
        moderationReviewedAt: null,
        blockedAt: null,
        source: "USER",
      },
    });

    return recipeSuccess(mapRecipeToRecord(copy));
  } catch (error) {
    return handlePrismaError(error);
  }
}
