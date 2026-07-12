import { jsonFromServiceResult } from "@/lib/tools/recipe-api-utils";
import { listRecipeCategories } from "@/lib/admin/admin-category-service";

/**
 * GET /api/tools/recipes/categories — Aktive Kategorien für Wizard/Dropdown.
 */
export async function GET() {
  const result = await listRecipeCategories({ activeOnly: true });

  return jsonFromServiceResult(result);
}
