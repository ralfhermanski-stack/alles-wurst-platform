import { resolveRecipeUserId } from "@/lib/auth/recipe-request-auth";
import {
  jsonFromServiceResult,
  jsonSuccess,
} from "@/lib/tools/recipe-api-utils";
import { recipeFailure } from "@/lib/tools/recipe-errors";
import { saveRecipeImage } from "@/lib/tools/recipe-image-storage";
import { updateRecipeImage } from "@/lib/tools/recipe-service";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * POST — Produktbild für ein eigenes Rezept hochladen.
 */
export async function POST(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const { id } = await context.params;
  const userId = await resolveRecipeUserId(request);

  if (!userId) {
    return jsonFromServiceResult(
      recipeFailure({
        code: "FORBIDDEN",
        message: "Anmeldung erforderlich.",
      }),
    );
  }

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
  const result = await updateRecipeImage(
    id,
    userId,
    saved.storageKey,
    saved.fileName,
  );

  if (!result.success) {
    return jsonFromServiceResult(result);
  }

  return jsonSuccess(result.data);
}
