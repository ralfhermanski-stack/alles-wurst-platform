/**
 * @file recipe-database-service.ts
 * @purpose Öffentliche Rezeptdatenbank — Teaser für alle, Detail nur mit Berechtigung.
 */

import {
  Prisma,
  RecipeStatus,
  RecipeVisibility,
  type Recipe,
} from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { hasActiveCourseAccess } from "@/lib/courses/course-access-service";
import {
  checkMembershipCapability,
  createMembershipContext,
  type MembershipAccessContext,
  type MembershipRole,
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

/** Stufen-Hinweis auf Teaser-Karten */
export type RecipeCatalogAccessLabel =
  | "Rezept des Monats"
  | "Kursrezept"
  | "Wurstclub"
  | "Meisterclub";

/** CTA, wenn das Rezept sichtbar, aber nicht öffenbar ist */
export type RecipeLockCta = "login" | "membership" | "course";

/** Kurzdarstellung für die Rezeptdatenbank-Liste (Teaser) */
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
  isRecipeOfMonth: boolean;
  hasImage: boolean;
  canOpen: boolean;
  accessLabel: RecipeCatalogAccessLabel;
  lockCta: RecipeLockCta | null;
};

/** Vollständige öffentliche Detailansicht */
export type PublicRecipeDetail = PublicRecipeSummary & {
  payload: RecipePayload | null;
};

const RECIPE_DB_BASE_WHERE: Prisma.RecipeWhereInput = {
  deletedAt: null,
  status: RecipeStatus.published,
  recipeKind: "wurst",
};

const FLEISCHERMEISTER_RALF_PUBLIC_NAME = "Fleischermeister_Ralf";

let cachedRalfUserId: string | null | undefined = undefined;

async function resolveRalfUserId(): Promise<string | null> {
  if (cachedRalfUserId !== undefined) {
    return cachedRalfUserId;
  }

  const profile = await prisma.userProfile.findUnique({
    where: { publicName: FLEISCHERMEISTER_RALF_PUBLIC_NAME },
    select: { userId: true },
  });

  cachedRalfUserId = profile?.userId ?? null;
  return cachedRalfUserId;
}

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

function isRecipeInPublicCatalog(
  recipe: Recipe,
  ralfUserId: string | null,
): boolean {
  if (
    recipe.deletedAt !== null ||
    recipe.status !== RecipeStatus.published ||
    recipe.recipeKind !== "wurst"
  ) {
    return false;
  }

  if (
    recipe.isRecipeOfMonth &&
    recipe.visibility === RecipeVisibility.database
  ) {
    return true;
  }

  if (recipe.isCourseLinked) {
    return true;
  }

  if (recipe.visibility === RecipeVisibility.public) {
    return true;
  }

  if (recipe.isMeisterclubSpecial) {
    return true;
  }

  if (
    ralfUserId &&
    recipe.userId === ralfUserId &&
    recipe.visibility === RecipeVisibility.database
  ) {
    return true;
  }

  return false;
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

function resolveAccessLabel(
  recipe: Recipe,
  ralfUserId: string | null,
): RecipeCatalogAccessLabel {
  if (recipe.isRecipeOfMonth) {
    return "Rezept des Monats";
  }

  if (recipe.isCourseLinked) {
    return "Kursrezept";
  }

  if (recipe.isMeisterclubSpecial) {
    return "Meisterclub";
  }

  if (recipe.visibility === RecipeVisibility.public) {
    return "Meisterclub";
  }

  if (ralfUserId && recipe.userId === ralfUserId) {
    return "Wurstclub";
  }

  return "Wurstclub";
}

function resolveLockCta(args: {
  canOpen: boolean;
  role: MembershipRole;
  recipe: Recipe;
}): RecipeLockCta | null {
  if (args.canOpen) {
    return null;
  }

  if (args.role === "guest") {
    return "login";
  }

  if (args.recipe.isCourseLinked && !args.recipe.isRecipeOfMonth) {
    return "course";
  }

  return "membership";
}

function mapToPublicSummary(
  recipe: Recipe,
  args: {
    canOpen: boolean;
    ralfUserId: string | null;
    role: MembershipRole;
  },
): PublicRecipeSummary {
  const payload = parseRecipePayload(recipe.payload) ?? getDefaultRecipePayload();
  const accessLabel = resolveAccessLabel(recipe, args.ralfUserId);

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
    isRecipeOfMonth: recipe.isRecipeOfMonth,
    hasImage: Boolean(recipe.imageStorageKey),
    canOpen: args.canOpen,
    accessLabel,
    lockCta: resolveLockCta({
      canOpen: args.canOpen,
      role: args.role,
      recipe,
    }),
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
 * WHERE für den öffentlichen Teaser-Katalog (sichtbar für alle Stufen).
 */
function buildCatalogAccessOr(
  ralfUserId: string | null,
): Prisma.RecipeWhereInput[] {
  const accessOr: Prisma.RecipeWhereInput[] = [
    {
      isRecipeOfMonth: true,
      visibility: RecipeVisibility.database,
    },
    { isCourseLinked: true },
    { visibility: RecipeVisibility.public },
    { isMeisterclubSpecial: true },
  ];

  if (ralfUserId) {
    accessOr.push({
      userId: ralfUserId,
      visibility: {
        in: [RecipeVisibility.database, RecipeVisibility.public],
      },
    });
  }

  return accessOr;
}

async function isCourseLinkedRecipeUnlockedForUser(
  args: { recipeId: string; userId: string },
): Promise<boolean> {
  const courseLessons = await prisma.courseLesson.findMany({
    where: {
      lessonType: "recipe",
      recipeId: args.recipeId,
    },
    select: {
      module: { select: { courseId: true } },
    },
  });

  const courseIds = Array.from(
    new Set(courseLessons.map((l) => l.module.courseId)),
  );

  if (courseIds.length === 0) {
    return false;
  }

  for (const courseId of courseIds) {
    const allowed = await hasActiveCourseAccess(args.userId, courseId);
    if (allowed) {
      return true;
    }
  }

  return false;
}

function canRecipeBeOpenedByRoleBase(args: {
  recipe: Recipe;
  role: MembershipAccessContext["role"];
  ralfUserId: string | null;
}): boolean {
  const { recipe, role, ralfUserId } = args;

  if (recipe.deletedAt !== null || recipe.status !== RecipeStatus.published) {
    return false;
  }

  const isMonthly = recipe.isRecipeOfMonth === true;
  if (isMonthly) {
    return recipe.visibility === RecipeVisibility.database;
  }

  const isRalfRecipe =
    ralfUserId !== null &&
    recipe.userId === ralfUserId &&
    (recipe.visibility === RecipeVisibility.database ||
      recipe.visibility === RecipeVisibility.public);

  switch (role) {
    case "registered":
      return false;
    case "wurstclub":
      return isRalfRecipe;
    case "meisterclub":
    case "admin": {
      const isPublic = recipe.visibility === RecipeVisibility.public;
      const isSpecial =
        recipe.isMeisterclubSpecial === true &&
        (recipe.visibility === RecipeVisibility.database ||
          recipe.visibility === RecipeVisibility.public);
      return isRalfRecipe || isPublic || isSpecial;
    }
    default:
      return false;
  }
}

/**
 * Prüft, ob der Nutzer das Rezept vollständig öffnen darf.
 * Gäste sehen nur Teaser; Registrierte u. a. Rezept des Monats + gebuchte Kursrezepte.
 */
export async function canUserOpenOfficialRecipe(args: {
  recipe: Recipe;
  membership: MembershipAccessContext;
  ralfUserId: string | null;
}): Promise<boolean> {
  const { recipe, membership, ralfUserId } = args;

  if (recipe.deletedAt !== null || recipe.status !== RecipeStatus.published) {
    return false;
  }

  if (membership.role === "guest" || !membership.userId) {
    return false;
  }

  const readCheck = checkMembershipCapability(
    membership,
    "recipe.database.read",
  );
  if (!readCheck.allowed) {
    return false;
  }

  // Monatsrezept: für alle Stufen mit Datenbank-Lesen (Basis inkl.).
  if (recipe.isRecipeOfMonth) {
    return recipe.visibility === RecipeVisibility.database;
  }

  // Kursrezepte: freigeschaltet durch Kursbuchung — unabhängig von Club-Stufe.
  if (recipe.isCourseLinked) {
    return isCourseLinkedRecipeUnlockedForUser({
      recipeId: recipe.id,
      userId: membership.userId,
    });
  }

  return canRecipeBeOpenedByRoleBase({
    recipe,
    role: membership.role,
    ralfUserId,
  });
}

function lockMessageForCta(
  lockCta: RecipeLockCta | null,
  accessLabel: RecipeCatalogAccessLabel,
): string {
  switch (lockCta) {
    case "login":
      return "Bitte melde dich an, um dieses Rezept zu öffnen.";
    case "course":
      return "Dieses Kursrezept wird freigeschaltet, sobald du den zugehörigen Kurs gebucht hast.";
    case "membership":
      return `Dieses Rezept ist für die Stufe „${accessLabel}“ freigeschaltet. Mit einer passenden Mitgliedschaft kannst du es öffnen.`;
    default:
      return "Du hast keinen Zugriff auf dieses Rezept.";
  }
}

/**
 * Listet Rezepte als Teaser-Katalog. Sichtbar für alle; `canOpen` steuert das Öffnen.
 */
export async function listOfficialRecipes(
  input: ListOfficialRecipesInput = {},
): Promise<RecipeServiceResult<PublicRecipeSummary[]>> {
  const membership =
    input.membership ?? createMembershipContext("guest", null);
  const role = membership.role;

  try {
    const ralfUserId = await resolveRalfUserId();
    const and: Prisma.RecipeWhereInput[] = [
      { OR: buildCatalogAccessOr(ralfUserId) },
    ];

    if (input.category?.trim()) {
      and.push({
        category: {
          equals: input.category.trim(),
          mode: "insensitive",
        },
      });
    }

    if (input.search?.trim()) {
      const term = input.search.trim();
      and.push({
        OR: [
          { name: { contains: term, mode: "insensitive" } },
          { description: { contains: term, mode: "insensitive" } },
        ],
      });
    }

    const recipes = await prisma.recipe.findMany({
      where: {
        ...RECIPE_DB_BASE_WHERE,
        AND: and,
      },
      orderBy: [
        { isRecipeOfMonth: "desc" },
        { publishedAt: "desc" },
        { updatedAt: "desc" },
      ],
    });

    const openFlags = await Promise.all(
      recipes.map((recipe) =>
        canUserOpenOfficialRecipe({ recipe, membership, ralfUserId }),
      ),
    );

    const summaries = recipes
      .map((recipe, index) =>
        mapToPublicSummary(recipe, {
          canOpen: openFlags[index] ?? false,
          ralfUserId,
          role,
        }),
      )
      .filter((summary) =>
        matchesRecipeTypeFilter(summary.recipeType, input.recipeType),
      );

    return recipeSuccess(summaries);
  } catch (error) {
    return handlePrismaError(error);
  }
}

/**
 * Lädt ein Rezept für die Detailseite.
 * Ohne Berechtigung: Teaser ohne Payload (`canOpen: false`).
 */
export async function getOfficialRecipeById(
  recipeId: string,
  membership?: MembershipAccessContext,
): Promise<RecipeServiceResult<PublicRecipeDetail>> {
  if (!isValidUuid(recipeId)) {
    return recipeFailure({
      code: "VALIDATION_ERROR",
      message: "Die Rezept-ID muss eine gültige UUID sein.",
    });
  }

  const access = membership ?? createMembershipContext("guest", null);

  try {
    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
    });

    const ralfUserId = await resolveRalfUserId();

    if (!recipe || !isRecipeInPublicCatalog(recipe, ralfUserId)) {
      return recipeFailure({
        code: "NOT_FOUND",
        message: "Das Rezept ist nicht in der Rezeptdatenbank verfügbar.",
      });
    }

    const canOpen = await canUserOpenOfficialRecipe({
      recipe,
      membership: access,
      ralfUserId,
    });

    const summary = mapToPublicSummary(recipe, {
      canOpen,
      ralfUserId,
      role: access.role,
    });

    if (!canOpen) {
      return recipeSuccess({
        ...summary,
        payload: null,
      });
    }

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
 * Kopiert ein Rezept aus der Rezeptdatenbank in die Rezepte des anfragenden Nutzers.
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

  if (!membership) {
    return recipeFailure({
      code: "FORBIDDEN",
      message: "Anmeldung erforderlich.",
    });
  }

  try {
    const source = await prisma.recipe.findUnique({
      where: { id: recipeId },
    });

    if (!source) {
      return recipeFailure({
        code: "NOT_FOUND",
        message: "Das Rezept kann nicht kopiert werden.",
      });
    }

    const ralfUserId = await resolveRalfUserId();

    const allowed = await canUserOpenOfficialRecipe({
      recipe: source,
      membership,
      ralfUserId,
    });

    if (!allowed) {
      return recipeFailure({
        code: "FORBIDDEN",
        message: lockMessageForCta(
          resolveLockCta({
            canOpen: false,
            role: membership.role,
            recipe: source,
          }),
          resolveAccessLabel(source, ralfUserId),
        ),
      });
    }

    if (
      source.visibility !== RecipeVisibility.database &&
      source.visibility !== RecipeVisibility.public
    ) {
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
        moderationStatus: "none",
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
