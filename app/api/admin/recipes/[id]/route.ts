import { RecipeStatus, RecipeVisibility } from "@prisma/client";

import {
  adminGuardResponse,
  getNullableStringField,
  getStringField,
  jsonFromServiceResult,
  parseJsonBody,
} from "@/lib/admin/admin-api-utils";
import {
  deleteAdminRecipe,
  getAdminRecipeById,
  updateAdminRecipe,
} from "@/lib/admin/admin-recipe-service";
import { parseRecipePayload } from "@/lib/tools/recipe-payload-validator";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/admin/recipes/[id] — Rezept für Admin laden.
 */
export async function GET(request: Request, context: RouteContext) {
  const guard = await adminGuardResponse(request);

  if (guard) {
    return guard;
  }

  const { id } = await context.params;
  const result = await getAdminRecipeById(id);

  return jsonFromServiceResult(result);
}

/**
 * PATCH /api/admin/recipes/[id] — Rezept als Admin bearbeiten.
 */
export async function PATCH(request: Request, context: RouteContext) {
  const guard = await adminGuardResponse(request);

  if (guard) {
    return guard;
  }

  const body = await parseJsonBody(request);

  if (!body) {
    return jsonFromServiceResult({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Ungültiger JSON-Body.",
      },
    });
  }

  const { id } = await context.params;

  const statusParam = getStringField(body, "status");
  const visibilityParam = getStringField(body, "visibility");

  const statusValues = Object.values(RecipeStatus);
  const visibilityValues = Object.values(RecipeVisibility);

  let payload;

  if (body.payload !== undefined) {
    const parsed = parseRecipePayload(body.payload);

    if (!parsed) {
      return jsonFromServiceResult({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Der Rezept-Payload ist ungültig.",
        },
      });
    }

    payload = parsed;
  }

  const result = await updateAdminRecipe(id, {
    name: getStringField(body, "name"),
    category: getNullableStringField(body, "category"),
    description: getNullableStringField(body, "description"),
    payload,
    status:
      statusParam && statusValues.includes(statusParam as RecipeStatus)
        ? (statusParam as RecipeStatus)
        : undefined,
    visibility:
      visibilityParam &&
      visibilityValues.includes(visibilityParam as RecipeVisibility)
        ? (visibilityParam as RecipeVisibility)
        : undefined,
    adminComment: getNullableStringField(body, "adminComment"),
  });

  return jsonFromServiceResult(result);
}

/**
 * DELETE /api/admin/recipes/[id] — Rezept soft-löschen (Admin).
 */
export async function DELETE(request: Request, context: RouteContext) {
  const guard = await adminGuardResponse(request);

  if (guard) {
    return guard;
  }

  const { id } = await context.params;
  const result = await deleteAdminRecipe(id);

  return jsonFromServiceResult(result);
}
