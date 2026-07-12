import { jsonFromServiceResult } from "@/lib/tools/recipe-api-utils";
import { getRecipeGeneratorSettings } from "@/lib/admin/admin-settings-service";

/**
 * GET /api/tools/recipes/pdf-settings — Öffentliche PDF-Einstellungen für Export.
 */
export async function GET() {
  const result = await getRecipeGeneratorSettings();

  return jsonFromServiceResult(result);
}
