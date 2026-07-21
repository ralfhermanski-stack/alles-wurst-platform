import { getRecipePdfLogoMeta } from "@/lib/admin/admin-settings-service";
import { readRecipePdfLogoBytes } from "@/lib/tools/recipe-pdf-logo-storage";

/**
 * GET /api/tools/recipes/pdf-logo — Öffentliche Auslieferung des PDF-Logos.
 */
export async function GET(): Promise<Response> {
  const meta = await getRecipePdfLogoMeta();

  if (!meta) {
    return new Response("Nicht gefunden", { status: 404 });
  }

  try {
    const bytes = await readRecipePdfLogoBytes(meta.storageKey);

    return new Response(Buffer.from(bytes), {
      headers: {
        "Content-Type": meta.mimeType,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return new Response("Bild nicht gefunden", { status: 404 });
  }
}
