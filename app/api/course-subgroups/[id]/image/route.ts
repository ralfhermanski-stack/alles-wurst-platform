import { readFile } from "node:fs/promises";

import { getCourseSubgroupImageMeta } from "@/lib/course-groups/course-group-service";
import { buildCourseGroupFallbackSvg } from "@/lib/course-groups/course-group-image-fallback";
import { resolveCourseGroupImagePath } from "@/lib/course-groups/course-group-storage";
import { guessImageMimeType } from "@/lib/tools/recipe-image-storage";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(
  _request: Request,
  context: RouteContext,
): Promise<Response> {
  const { id } = await context.params;
  const meta = await getCourseSubgroupImageMeta(id);

  if (meta.storageKey) {
    try {
      const bytes = await readFile(resolveCourseGroupImagePath(meta.storageKey));

      return new Response(bytes, {
        headers: {
          "Content-Type": guessImageMimeType(meta.storageKey),
          "Cache-Control": "public, max-age=3600",
        },
      });
    } catch {
      // Fallback unten
    }
  }

  const fallback = buildCourseGroupFallbackSvg(meta.title);

  return new Response(fallback, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
