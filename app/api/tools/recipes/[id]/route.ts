/**
 * @file app/api/tools/recipes/[id]/route.ts
 * @purpose API: Einzelnes Rezept lesen, aktualisieren und löschen.
 * @routes GET    /api/tools/recipes/{id}?userId=...
 *          PATCH  /api/tools/recipes/{id}
 *          DELETE /api/tools/recipes/{id}?userId=...
 */

import { resolveRecipeUserId } from "@/lib/auth/recipe-request-auth";
import {
  getNullableStringField,
  getStringField,
  jsonFromServiceResult,
  parseJsonBody,
} from "@/lib/tools/recipe-api-utils";
import { recipeFailure } from "@/lib/tools/recipe-errors";
import { parseRecipePayload } from "@/lib/tools/recipe-payload-validator";
import {
  deleteRecipe,
  getRecipeById,
  updateRecipe,
} from "@/lib/tools/recipe-service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET — Einzelnes Rezept laden.
 */
export async function GET(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const { id } = await context.params;
  const userId = await resolveRecipeUserId(request);

  if (!userId) {
    return jsonFromServiceResult(
      recipeFailure({
        code: "VALIDATION_ERROR",
        message: "Nutzer-ID ist erforderlich (Session oder userId-Parameter).",
      }),
    );
  }

  const result = await getRecipeById(id, userId);

  return jsonFromServiceResult(result);
}

/**
 * PATCH — Rezept aktualisieren (Stammdaten und/oder payload).
 * Body: { userId, name?, category?, description?, payload? }
 */
export async function PATCH(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const { id } = await context.params;
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

  if (!userId) {
    return jsonFromServiceResult(
      recipeFailure({
        code: "VALIDATION_ERROR",
        message: "Feld userId ist erforderlich.",
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

  const isRecipeOfMonth =
    typeof body.isRecipeOfMonth === "boolean"
      ? body.isRecipeOfMonth
      : undefined;
  const isCourseLinked =
    typeof body.isCourseLinked === "boolean" ? body.isCourseLinked : undefined;
  const isMeisterclubSpecial =
    typeof body.isMeisterclubSpecial === "boolean"
      ? body.isMeisterclubSpecial
      : undefined;

  const result = await updateRecipe(id, {
    userId,
    name: getStringField(body, "name"),
    category: getNullableStringField(body, "category"),
    description: getNullableStringField(body, "description"),
    payload,
    isRecipeOfMonth,
    isCourseLinked,
    isMeisterclubSpecial,
  });

  return jsonFromServiceResult(result);
}

/**
 * DELETE — Rezept soft-löschen.
 */
export async function DELETE(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const { id } = await context.params;
  const body = await parseJsonBody(request);
  const userId = await resolveRecipeUserId(request, body);

  if (!userId) {
    return jsonFromServiceResult(
      recipeFailure({
        code: "VALIDATION_ERROR",
        message: "userId ist erforderlich (Query oder Body).",
      }),
    );
  }

  const result = await deleteRecipe(id, userId);

  return jsonFromServiceResult(result);
}
