import { adminGuardResponse } from "@/lib/admin/admin-api-utils";
import { updateAdminRecipeImage } from "@/lib/admin/admin-recipe-service";
import { jsonSuccess, jsonFromServiceResult } from "@/lib/tools/recipe-api-utils";
import { recipeFailure } from "@/lib/tools/recipe-errors";
import { saveRecipeImage } from "@/lib/tools/recipe-image-storage";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const denied = await adminGuardResponse(request);

  if (denied) {
    return denied;
  }

  const { id } = await context.params;
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return jsonFromServiceResult(
      recipeFailure({
        code: "VALIDATION_ERROR",
        message: "Bilddatei ist erforderlich.",
      }),
    );
  }

  if (!file.type.startsWith("image/")) {
    return jsonFromServiceResult(
      recipeFailure({
        code: "VALIDATION_ERROR",
        message: "Nur Bilddateien sind erlaubt.",
      }),
    );
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const saved = await saveRecipeImage(id, file.name, bytes);

  const result = await updateAdminRecipeImage(id, saved.storageKey, saved.fileName);

  if (!result.success) {
    return jsonFromServiceResult(result);
  }

  return jsonSuccess(result.data);
}
