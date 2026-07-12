/**
 * @file marinade-service.ts
 * @purpose CRUD für Marinaden-Rezepte in der recipes-Tabelle (recipeKind = marinade).
 */

import {
  Prisma,
  type Recipe,
  RecipeStatus,
  RecipeVisibility,
} from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import type { MembershipAccessContext } from "@/lib/membership/membership-rules";
import { guardMembershipCheck } from "@/lib/membership/membership-guard";
import { canReadMarinadeRecipe, canDownloadMarinadePdf, canSaveMarinade } from "./marinade-access";
import { calculateMarinade } from "./marinade-calculator";
import { generateAndStoreMarinadePdf } from "./marinade-pdf-service";
import {
  getDefaultMarinadePayload,
  parseMarinadePayload,
} from "./marinade-payload-validator";
import {
  recipeFailure,
  recipeSuccess,
  type RecipeServiceResult,
} from "./recipe-errors";
import { isValidUuid } from "./recipe-payload-validator";
import { validateMarinadeForSave } from "./marinade-calculator";
import type { MarinadeRecipePayload } from "./marinade-types";

const RECIPE_KIND_MARINADE = "marinade" as const;
type MarinadePdfStatus = "none" | "current" | "outdated";

export type MarinadeRecord = {
  id: string;
  userId: string;
  name: string;
  category: string | null;
  description: string | null;
  status: RecipeStatus;
  visibility: RecipeVisibility;
  totalWeightKg: number | null;
  payload: MarinadeRecipePayload;
  version: number;
  publishedAt: string | null;
  recipeKind: "marinade";
  pdfStatus: MarinadePdfStatus;
  pdfGeneratedAt: string | null;
  pdfVersion: number | null;
  hasPdf: boolean;
  moderationStatus: string;
  isOfficialDatabase: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type CreateMarinadeInput = {
  userId: string;
  name: string;
  category?: string | null;
  description?: string | null;
  payload?: MarinadeRecipePayload;
  status?: RecipeStatus;
  visibility?: RecipeVisibility;
  membership: MembershipAccessContext;
};

export type UpdateMarinadeInput = {
  userId: string;
  name?: string;
  category?: string | null;
  description?: string | null;
  payload?: MarinadeRecipePayload;
  status?: RecipeStatus;
  visibility?: RecipeVisibility;
  membership: MembershipAccessContext;
  isAdmin?: boolean;
};

function handlePrismaError(error: unknown): RecipeServiceResult<never> {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2025") {
      return recipeFailure({
        code: "NOT_FOUND",
        message: "Das Marinaden-Rezept wurde nicht gefunden.",
      });
    }
  }

  console.error("[marinade-service] Unerwarteter Datenbankfehler:", error);

  return recipeFailure({
    code: "INTERNAL_ERROR",
    message: "Ein interner Fehler ist aufgetreten. Bitte später erneut versuchen.",
  });
}

function validateUserId(userId: string): RecipeServiceResult<string> {
  if (!userId.trim()) {
    return recipeFailure({
      code: "VALIDATION_ERROR",
      message: "Die userId ist erforderlich.",
    });
  }

  if (!isValidUuid(userId)) {
    return recipeFailure({
      code: "VALIDATION_ERROR",
      message: "Die userId muss eine gültige UUID sein.",
    });
  }

  return recipeSuccess(userId);
}

function validateName(name: string): RecipeServiceResult<string> {
  const trimmed = name.trim();

  if (!trimmed) {
    return recipeFailure({
      code: "VALIDATION_ERROR",
      message: "Der Rezeptname ist erforderlich.",
    });
  }

  if (trimmed.length > 200) {
    return recipeFailure({
      code: "VALIDATION_ERROR",
      message: "Der Rezeptname darf maximal 200 Zeichen lang sein.",
    });
  }

  return recipeSuccess(trimmed);
}

function mapMarinadeRecord(recipe: Recipe): MarinadeRecord {
  const payload =
    parseMarinadePayload(recipe.payload) ?? getDefaultMarinadePayload();

  return {
    id: recipe.id,
    userId: recipe.userId,
    name: recipe.name,
    category: recipe.category,
    description: recipe.description,
    status: recipe.status,
    visibility: recipe.visibility,
    totalWeightKg:
      recipe.totalWeightKg !== null ? Number(recipe.totalWeightKg) : null,
    payload,
    version: recipe.version,
    publishedAt: recipe.publishedAt?.toISOString() ?? null,
    recipeKind: "marinade",
    pdfStatus: recipe.pdfStatus,
    pdfGeneratedAt: recipe.pdfGeneratedAt?.toISOString() ?? null,
    pdfVersion: recipe.pdfVersion,
    hasPdf: Boolean(recipe.pdfStorageKey) && recipe.pdfStatus === "current",
    moderationStatus: recipe.moderationStatus,
    isOfficialDatabase: recipe.isOfficialDatabase,
    createdAt: recipe.createdAt.toISOString(),
    updatedAt: recipe.updatedAt.toISOString(),
    deletedAt: recipe.deletedAt?.toISOString() ?? null,
  };
}

function preparePayload(payload: MarinadeRecipePayload): {
  payload: MarinadeRecipePayload;
  totalWeightKg: number;
} {
  const calculation = calculateMarinade(payload);

  return {
    payload: {
      ...payload,
      totalWeightKg: calculation.totalWeightKg,
      warnings: calculation.warnings,
    },
    totalWeightKg: calculation.totalWeightKg,
  };
}

function canWriteMarinade(
  recipe: Recipe,
  userId: string,
  isAdmin: boolean,
): boolean {
  if (recipe.deletedAt !== null) {
    return false;
  }

  if (isAdmin) {
    return true;
  }

  return recipe.userId === userId;
}

async function loadMarinadeOrFail(
  recipeId: string,
): Promise<RecipeServiceResult<Recipe>> {
  if (!isValidUuid(recipeId)) {
    return recipeFailure({
      code: "VALIDATION_ERROR",
      message: "Ungültige Rezept-ID.",
    });
  }

  const recipe = await prisma.recipe.findUnique({ where: { id: recipeId } });

  if (!recipe || recipe.recipeKind !== RECIPE_KIND_MARINADE) {
    return recipeFailure({
      code: "NOT_FOUND",
      message: "Das Marinaden-Rezept wurde nicht gefunden.",
    });
  }

  return recipeSuccess(recipe);
}

function assertReadAccess(
  recipe: Recipe,
  userId: string,
  membership: MembershipAccessContext,
  isAdmin: boolean,
): RecipeServiceResult<Recipe> {
  const allowed = canReadMarinadeRecipe({
    recipeUserId: recipe.userId,
    visibility: recipe.visibility,
    isOfficialDatabase: recipe.isOfficialDatabase,
    moderationStatus: recipe.moderationStatus,
    requestingUserId: userId,
    isAdmin,
    membership,
  });

  if (!allowed) {
    return recipeFailure({
      code: "FORBIDDEN",
      message: "Du hast keine Berechtigung, dieses Marinaden-Rezept zu lesen.",
    });
  }

  return recipeSuccess(recipe);
}

export async function createMarinade(
  input: CreateMarinadeInput,
): Promise<RecipeServiceResult<MarinadeRecord>> {
  const userResult = validateUserId(input.userId);

  if (!userResult.success) {
    return userResult;
  }

  const saveCheck = canSaveMarinade(input.membership);
  const saveGuard = guardMembershipCheck(saveCheck);

  if (saveGuard) {
    return saveGuard;
  }

  const nameResult = validateName(input.name);

  if (!nameResult.success) {
    return nameResult;
  }

  const payload = input.payload ?? getDefaultMarinadePayload();
  const validation = validateMarinadeForSave(payload);

  if (!validation.valid) {
    return recipeFailure({
      code: "VALIDATION_ERROR",
      message: validation.errors[0] ?? "Validierung fehlgeschlagen.",
      details: Object.fromEntries(
        validation.errors.map((error, index) => [`error_${index}`, error]),
      ),
    });
  }

  const prepared = preparePayload(payload);
  const status = input.status ?? RecipeStatus.draft;
  const visibility = input.visibility ?? RecipeVisibility.private;

  try {
    const recipe = await prisma.recipe.create({
      data: {
        userId: input.userId,
        name: nameResult.data,
        category: input.category ?? "Marinade",
        description: input.description ?? null,
        status,
        visibility,
        totalWeightKg: prepared.totalWeightKg,
        payload: prepared.payload as Prisma.InputJsonValue,
        version: 1,
        recipeKind: RECIPE_KIND_MARINADE,
        pdfStatus: "none",
        publishedAt:
          status === RecipeStatus.published ||
          visibility === RecipeVisibility.database
            ? new Date()
            : null,
      },
    });

    return recipeSuccess(mapMarinadeRecord(recipe));
  } catch (error) {
    return handlePrismaError(error);
  }
}

export async function getMarinadeById(
  recipeId: string,
  requestingUserId: string,
  membership: MembershipAccessContext,
  isAdmin = false,
): Promise<RecipeServiceResult<MarinadeRecord>> {
  const userResult = validateUserId(requestingUserId);

  if (!userResult.success) {
    return userResult;
  }

  try {
    const loaded = await loadMarinadeOrFail(recipeId);

    if (!loaded.success) {
      return loaded;
    }

    const access = assertReadAccess(
      loaded.data,
      requestingUserId,
      membership,
      isAdmin,
    );

    if (!access.success) {
      return access;
    }

    return recipeSuccess(mapMarinadeRecord(loaded.data));
  } catch (error) {
    return handlePrismaError(error);
  }
}

export async function listMarinades(input: {
  userId: string;
  membership: MembershipAccessContext;
}): Promise<RecipeServiceResult<MarinadeRecord[]>> {
  const userResult = validateUserId(input.userId);

  if (!userResult.success) {
    return userResult;
  }

  try {
    const recipes = await prisma.recipe.findMany({
      where: {
        userId: input.userId,
        recipeKind: RECIPE_KIND_MARINADE,
        deletedAt: null,
      },
      orderBy: { updatedAt: "desc" },
    });

    return recipeSuccess(recipes.map(mapMarinadeRecord));
  } catch (error) {
    return handlePrismaError(error);
  }
}

export async function updateMarinade(
  recipeId: string,
  input: UpdateMarinadeInput,
): Promise<RecipeServiceResult<MarinadeRecord>> {
  const userResult = validateUserId(input.userId);

  if (!userResult.success) {
    return userResult;
  }

  const saveCheck = canSaveMarinade(input.membership);
  const saveGuard = guardMembershipCheck(saveCheck);

  if (saveGuard) {
    return saveGuard;
  }

  try {
    const loaded = await loadMarinadeOrFail(recipeId);

    if (!loaded.success) {
      return loaded;
    }

    if (!canWriteMarinade(loaded.data, input.userId, Boolean(input.isAdmin))) {
      return recipeFailure({
        code: "FORBIDDEN",
        message: "Du hast keine Berechtigung, dieses Rezept zu bearbeiten.",
      });
    }

    const data: Prisma.RecipeUpdateInput = {
      pdfStatus: "outdated",
    };

    if (input.name !== undefined) {
      const nameResult = validateName(input.name);

      if (!nameResult.success) {
        return nameResult;
      }

      data.name = nameResult.data;
    }

    if (input.category !== undefined) {
      data.category = input.category;
    }

    if (input.description !== undefined) {
      data.description = input.description;
    }

    if (input.status !== undefined) {
      data.status = input.status;
    }

    if (input.visibility !== undefined) {
      data.visibility = input.visibility;
    }

    if (input.payload !== undefined) {
      const validation = validateMarinadeForSave(input.payload);

      if (!validation.valid) {
        return recipeFailure({
          code: "VALIDATION_ERROR",
          message: validation.errors[0] ?? "Validierung fehlgeschlagen.",
          details: Object.fromEntries(
            validation.errors.map((error, index) => [`error_${index}`, error]),
          ),
        });
      }

      const prepared = preparePayload(input.payload);
      data.payload = prepared.payload as Prisma.InputJsonValue;
      data.totalWeightKg = prepared.totalWeightKg;
      data.version = { increment: 1 };
    }

    const recipe = await prisma.recipe.update({
      where: { id: recipeId },
      data,
    });

    return recipeSuccess(mapMarinadeRecord(recipe));
  } catch (error) {
    return handlePrismaError(error);
  }
}

export async function deleteMarinade(
  recipeId: string,
  userId: string,
  isAdmin = false,
): Promise<RecipeServiceResult<{ id: string }>> {
  const userResult = validateUserId(userId);

  if (!userResult.success) {
    return userResult;
  }

  try {
    const loaded = await loadMarinadeOrFail(recipeId);

    if (!loaded.success) {
      return loaded;
    }

    if (!canWriteMarinade(loaded.data, userId, isAdmin)) {
      return recipeFailure({
        code: "FORBIDDEN",
        message: "Du hast keine Berechtigung, dieses Rezept zu löschen.",
      });
    }

    await prisma.recipe.update({
      where: { id: recipeId },
      data: { deletedAt: new Date(), pdfStatus: "outdated" },
    });

    return recipeSuccess({ id: recipeId });
  } catch (error) {
    return handlePrismaError(error);
  }
}

export async function duplicateMarinade(
  recipeId: string,
  userId: string,
  membership: MembershipAccessContext,
): Promise<RecipeServiceResult<MarinadeRecord>> {
  const loaded = await getMarinadeById(recipeId, userId, membership);

  if (!loaded.success) {
    return loaded;
  }

  const source = loaded.data;

  return createMarinade({
    userId,
    name: `${source.name} (Kopie)`,
    category: source.category,
    description: source.description,
    payload: structuredClone(source.payload),
    status: RecipeStatus.draft,
    visibility: RecipeVisibility.private,
    membership,
  });
}

export async function generateMarinadePdf(
  recipeId: string,
  userId: string,
  membership: MembershipAccessContext,
  creatorName: string,
  isAdmin = false,
): Promise<RecipeServiceResult<MarinadeRecord>> {
  const pdfCheck = isAdmin
    ? ({ allowed: true } as const)
    : canDownloadMarinadePdf(membership);
  const pdfGuard = guardMembershipCheck(pdfCheck);

  if (pdfGuard) {
    return pdfGuard;
  }

  try {
    const loaded = await loadMarinadeOrFail(recipeId);

    if (!loaded.success) {
      return loaded;
    }

    const access = assertReadAccess(
      loaded.data,
      userId,
      membership,
      isAdmin,
    );

    if (!access.success) {
      return access;
    }

    if (!canWriteMarinade(loaded.data, userId, isAdmin)) {
      return recipeFailure({
        code: "FORBIDDEN",
        message: "Nur der Besitzer kann ein PDF erzeugen.",
      });
    }

    const payload =
      parseMarinadePayload(loaded.data.payload) ?? getDefaultMarinadePayload();

    const { storageKey, generatedAt } = await generateAndStoreMarinadePdf(
      {
        recipeId,
        recipeName: loaded.data.name,
        creatorName,
        payload,
        version: loaded.data.version,
      },
      loaded.data.pdfStorageKey,
    );

    const recipe = await prisma.recipe.update({
      where: { id: recipeId },
      data: {
        pdfStorageKey: storageKey,
        pdfGeneratedAt: generatedAt,
        pdfVersion: loaded.data.version,
        pdfStatus: "current",
      },
    });

    return recipeSuccess(mapMarinadeRecord(recipe));
  } catch (error) {
    return handlePrismaError(error);
  }
}

export async function getMarinadePdfForDownload(
  recipeId: string,
  userId: string,
  membership: MembershipAccessContext,
  isAdmin = false,
): Promise<
  RecipeServiceResult<{
    bytes: Uint8Array;
    fileName: string;
    recipe: MarinadeRecord;
  }>
> {
  try {
    const loaded = await loadMarinadeOrFail(recipeId);

    if (!loaded.success) {
      return loaded;
    }

    const access = assertReadAccess(
      loaded.data,
      userId,
      membership,
      isAdmin,
    );

    if (!access.success) {
      return access;
    }

    if (
      !loaded.data.pdfStorageKey ||
      loaded.data.pdfStatus !== "current"
    ) {
      return recipeFailure({
        code: "NOT_FOUND",
        message: "Kein aktuelles PDF vorhanden. Bitte zuerst erzeugen.",
      });
    }

    const { loadMarinadePdfBytes } = await import("./marinade-pdf-service");
    const bytes = await loadMarinadePdfBytes(loaded.data.pdfStorageKey);

    return recipeSuccess({
      bytes,
      fileName: `${loaded.data.name.replace(/[^a-zA-Z0-9äöüÄÖÜß._-]/g, "_")}.pdf`,
      recipe: mapMarinadeRecord(loaded.data),
    });
  } catch (error) {
    return handlePrismaError(error);
  }
}
