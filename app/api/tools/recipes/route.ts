/**
 * @file app/api/tools/recipes/route.ts
 * @purpose API: Rezeptliste lesen und Rezept erstellen.
 * @routes GET  /api/tools/recipes?userId=...&includePublic=true
 *          POST /api/tools/recipes
 */

import { RecipeStatus, RecipeVisibility } from "@prisma/client";

import {
  buildRecipeMembershipContext,
  resolveRecipeUserId,
} from "@/lib/auth/recipe-request-auth";
import {
  getNullableStringField,
  getStringField,
  jsonFromServiceResult,
  jsonSuccess,
  parseJsonBody,
} from "@/lib/tools/recipe-api-utils";
import { recipeFailure } from "@/lib/tools/recipe-errors";
import { parseRecipePayload } from "@/lib/tools/recipe-payload-validator";
import { checkMembershipCapability } from "@/lib/membership/membership-rules";
import { guardMembershipCheck } from "@/lib/membership/membership-guard";
import { createRecipe, listRecipes } from "@/lib/tools/recipe-service";

/**
 * GET — Rezeptliste für einen Nutzer.
 * Query: userId (Pflicht), includePublic (optional, "true" für fremde öffentliche Rezepte)
 */
export async function GET(request: Request): Promise<Response> {
  const userId = await resolveRecipeUserId(request);

  if (!userId) {
    return jsonFromServiceResult(
      recipeFailure({
        code: "VALIDATION_ERROR",
        message: "Nutzer-ID ist erforderlich (Session oder userId-Parameter).",
      }),
    );
  }

  const membership = await buildRecipeMembershipContext(request, userId);
  const listCheck = checkMembershipCapability(membership, "recipe.own.list");
  const listGuard = guardMembershipCheck(listCheck);

  if (listGuard) {
    return jsonFromServiceResult(listGuard);
  }

  const includePublic =
    new URL(request.url).searchParams.get("includePublic") === "true";

  const result = await listRecipes({ userId, includePublic });

  return jsonFromServiceResult(result);
}

/**
 * POST — Neues Rezept anlegen.
 * Body: { userId, name, category?, description?, payload?, status?, visibility? }
 */
export async function POST(request: Request): Promise<Response> {
  const body = await parseJsonBody(request);

  if (!body) {
    return jsonFromServiceResult(
      recipeFailure({
        code: "VALIDATION_ERROR",
        message: "Ungültiger JSON-Body.",
      }),
    );
  }

  const userId = await resolveRecipeUserId(request, body);
  const name = getStringField(body, "name");

  if (!userId || !name) {
    return jsonFromServiceResult(
      recipeFailure({
        code: "VALIDATION_ERROR",
        message: "Felder userId und name sind erforderlich.",
      }),
    );
  }

  let payload;

  if (body.payload !== undefined) {
    payload = parseRecipePayload(body.payload);

    if (!payload) {
      return jsonFromServiceResult(
        recipeFailure({
          code: "VALIDATION_ERROR",
          message: "Das payload-Feld entspricht nicht dem RecipePayload-Format.",
        }),
      );
    }
  }

  const statusRaw = getStringField(body, "status");
  const visibilityRaw = getStringField(body, "visibility");

  const status =
    statusRaw &&
    Object.values(RecipeStatus).includes(statusRaw as RecipeStatus)
      ? (statusRaw as RecipeStatus)
      : undefined;

  const visibility =
    visibilityRaw &&
    Object.values(RecipeVisibility).includes(
      visibilityRaw as RecipeVisibility,
    )
      ? (visibilityRaw as RecipeVisibility)
      : undefined;

  const membership = await buildRecipeMembershipContext(request, userId, body);

  const result = await createRecipe({
    userId,
    name,
    category: getNullableStringField(body, "category"),
    description: getNullableStringField(body, "description"),
    payload,
    status,
    visibility,
    membership,
  });

  if (result.success) {
    return jsonSuccess(result.data, 201);
  }

  return jsonFromServiceResult(result);
}
