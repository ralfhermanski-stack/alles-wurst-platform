/**
 * @file admin-category-service.ts
 * @purpose CRUD für verwaltete Rezeptkategorien.
 */

import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import {
  recipeFailure,
  recipeSuccess,
  type RecipeServiceResult,
} from "@/lib/tools/recipe-errors";
import { isValidUuid } from "@/lib/tools/recipe-payload-validator";

export type RecipeCategoryRecord = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateCategoryInput = {
  name: string;
  slug?: string;
  description?: string | null;
  sortOrder?: number;
  active?: boolean;
};

export type UpdateCategoryInput = {
  name?: string;
  slug?: string;
  description?: string | null;
  sortOrder?: number;
  active?: boolean;
};

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function mapCategory(
  row: Prisma.RecipeCategoryGetPayload<object>,
): RecipeCategoryRecord {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    sortOrder: row.sortOrder,
    active: row.active,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function handlePrismaError(error: unknown): RecipeServiceResult<never> {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return recipeFailure({
        code: "VALIDATION_ERROR",
        message: "Name oder Slug ist bereits vergeben.",
      });
    }

    if (error.code === "P2025") {
      return recipeFailure({
        code: "NOT_FOUND",
        message: "Die Kategorie wurde nicht gefunden.",
      });
    }
  }

  console.error("[admin-category-service] Unerwarteter Datenbankfehler:", error);

  return recipeFailure({
    code: "INTERNAL_ERROR",
    message: "Ein interner Fehler ist aufgetreten. Bitte später erneut versuchen.",
  });
}

/**
 * Listet alle Kategorien (Admin: alle, öffentlich: nur aktive).
 */
export async function listRecipeCategories(options?: {
  activeOnly?: boolean;
}): Promise<RecipeServiceResult<RecipeCategoryRecord[]>> {
  try {
    const categories = await prisma.recipeCategory.findMany({
      where: options?.activeOnly ? { active: true } : undefined,
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });

    return recipeSuccess(categories.map(mapCategory));
  } catch (error) {
    return handlePrismaError(error);
  }
}

/**
 * Legt eine neue Kategorie an.
 */
export async function createRecipeCategory(
  input: CreateCategoryInput,
): Promise<RecipeServiceResult<RecipeCategoryRecord>> {
  const name = input.name.trim();

  if (!name) {
    return recipeFailure({
      code: "VALIDATION_ERROR",
      message: "Der Kategoriename ist erforderlich.",
    });
  }

  const slug = slugify(input.slug ?? name);

  if (!slug) {
    return recipeFailure({
      code: "VALIDATION_ERROR",
      message: "Der Slug ist ungültig.",
    });
  }

  try {
    const category = await prisma.recipeCategory.create({
      data: {
        name,
        slug,
        description: input.description ?? null,
        sortOrder: input.sortOrder ?? 0,
        active: input.active ?? true,
      },
    });

    return recipeSuccess(mapCategory(category));
  } catch (error) {
    return handlePrismaError(error);
  }
}

/**
 * Aktualisiert eine Kategorie.
 */
export async function updateRecipeCategory(
  id: string,
  input: UpdateCategoryInput,
): Promise<RecipeServiceResult<RecipeCategoryRecord>> {
  if (!isValidUuid(id)) {
    return recipeFailure({
      code: "VALIDATION_ERROR",
      message: "Die Kategorie-ID muss eine gültige UUID sein.",
    });
  }

  try {
    const data: Prisma.RecipeCategoryUpdateInput = {};

    if (input.name !== undefined) {
      const name = input.name.trim();

      if (!name) {
        return recipeFailure({
          code: "VALIDATION_ERROR",
          message: "Der Kategoriename ist erforderlich.",
        });
      }

      data.name = name;
    }

    if (input.slug !== undefined) {
      const slug = slugify(input.slug);

      if (!slug) {
        return recipeFailure({
          code: "VALIDATION_ERROR",
          message: "Der Slug ist ungültig.",
        });
      }

      data.slug = slug;
    }

    if (input.description !== undefined) {
      data.description = input.description;
    }

    if (input.sortOrder !== undefined) {
      data.sortOrder = input.sortOrder;
    }

    if (input.active !== undefined) {
      data.active = input.active;
    }

    const category = await prisma.recipeCategory.update({
      where: { id },
      data,
    });

    return recipeSuccess(mapCategory(category));
  } catch (error) {
    return handlePrismaError(error);
  }
}

/**
 * Löscht eine Kategorie.
 */
export async function deleteRecipeCategory(
  id: string,
): Promise<RecipeServiceResult<{ id: string }>> {
  if (!isValidUuid(id)) {
    return recipeFailure({
      code: "VALIDATION_ERROR",
      message: "Die Kategorie-ID muss eine gültige UUID sein.",
    });
  }

  try {
    await prisma.recipeCategory.delete({
      where: { id },
    });

    return recipeSuccess({ id });
  } catch (error) {
    return handlePrismaError(error);
  }
}
