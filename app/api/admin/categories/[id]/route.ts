import {
  adminGuardResponse,
  jsonFromServiceResult,
  parseJsonBody,
} from "@/lib/admin/admin-api-utils";
import {
  deleteRecipeCategory,
  updateRecipeCategory,
} from "@/lib/admin/admin-category-service";
import {
  getNullableStringField,
  getStringField,
} from "@/lib/tools/recipe-api-utils";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * PATCH /api/admin/categories/[id]
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

  const sortOrder =
    typeof body.sortOrder === "number" && Number.isFinite(body.sortOrder)
      ? body.sortOrder
      : undefined;

  const result = await updateRecipeCategory(id, {
    name: getStringField(body, "name"),
    slug: getStringField(body, "slug"),
    description: getNullableStringField(body, "description"),
    sortOrder,
    active: typeof body.active === "boolean" ? body.active : undefined,
  });

  return jsonFromServiceResult(result);
}

/**
 * DELETE /api/admin/categories/[id]
 */
export async function DELETE(request: Request, context: RouteContext) {
  const guard = await adminGuardResponse(request);

  if (guard) {
    return guard;
  }

  const { id } = await context.params;
  const result = await deleteRecipeCategory(id);

  return jsonFromServiceResult(result);
}
