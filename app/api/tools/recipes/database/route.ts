import { buildRecipeMembershipContext } from "@/lib/auth/recipe-request-auth";
import { jsonFromServiceResult } from "@/lib/tools/recipe-api-utils";
import {
  listOfficialRecipes,
  type RecipeDatabaseTypeFilter,
} from "@/lib/tools/recipe-database-service";

const RECIPE_TYPE_VALUES: RecipeDatabaseTypeFilter[] = [
  "all",
  "smoked",
  "fresh",
];

/**
 * GET /api/tools/recipes/database — Öffentliche offizielle Rezeptliste.
 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const recipeTypeParam = params.get("recipeType");

  const recipeType =
    recipeTypeParam &&
    RECIPE_TYPE_VALUES.includes(recipeTypeParam as RecipeDatabaseTypeFilter)
      ? (recipeTypeParam as RecipeDatabaseTypeFilter)
      : undefined;

  const membership = await buildRecipeMembershipContext(request, null);

  const result = await listOfficialRecipes({
    category: params.get("category") ?? undefined,
    search: params.get("search") ?? undefined,
    recipeType,
    membership,
  });

  return jsonFromServiceResult(result);
}
