import { readFile } from "node:fs/promises";

import { getRecipeImageStorageKey } from "@/lib/admin/admin-recipe-service";
import {
  guessImageMimeType,
  resolveRecipeImagePath,
} from "@/lib/tools/recipe-image-storage";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(
  _request: Request,
  context: RouteContext,
): Promise<Response> {
  const { id } = await context.params;
  const storageKey = await getRecipeImageStorageKey(id);

  if (!storageKey) {
    return new Response("Kein Rezeptbild.", { status: 404 });
  }

  try {
    const bytes = await readFile(resolveRecipeImagePath(storageKey));

    return new Response(bytes, {
      headers: {
        "Content-Type": guessImageMimeType(storageKey),
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return new Response("Rezeptbild nicht gefunden.", { status: 404 });
  }
}
