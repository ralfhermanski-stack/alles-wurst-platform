import {
  adminGuardResponse,
  jsonFromServiceResult,
  parseJsonBody,
} from "@/lib/admin/admin-api-utils";
import {
  createRecipeCategory,
  listRecipeCategories,
} from "@/lib/admin/admin-category-service";
import {
  getNullableStringField,
  getStringField,
} from "@/lib/tools/recipe-api-utils";

/**
 * GET /api/admin/categories — Alle Kategorien.
 */
export async function GET(request: Request) {
  const guard = await adminGuardResponse(request);

  if (guard) {
    return guard;
  }

  const result = await listRecipeCategories();

  return jsonFromServiceResult(result);
}

/**
 * POST /api/admin/categories — Neue Kategorie.
 */
export async function POST(request: Request) {
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

  const name = getStringField(body, "name");

  if (!name) {
    return jsonFromServiceResult({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Der Kategoriename ist erforderlich.",
      },
    });
  }

  const sortOrder =
    typeof body.sortOrder === "number" && Number.isFinite(body.sortOrder)
      ? body.sortOrder
      : undefined;

  const result = await createRecipeCategory({
    name,
    slug: getStringField(body, "slug"),
    description: getNullableStringField(body, "description"),
    sortOrder,
    active: typeof body.active === "boolean" ? body.active : undefined,
  });

  return jsonFromServiceResult(result);
}
