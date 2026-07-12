import { readFile } from "node:fs/promises";

import { getCourseCoverStorageKey } from "@/lib/courses/admin-course-service";
import { guessImageMimeType } from "@/lib/tools/recipe-image-storage";
import { resolveCourseCoverPath } from "@/lib/courses/course-cover-storage";

type RouteContext = { params: Promise<{ courseId: string }> };

export async function GET(
  _request: Request,
  context: RouteContext,
): Promise<Response> {
  const { courseId } = await context.params;
  const storageKey = await getCourseCoverStorageKey(courseId);

  if (!storageKey) {
    return new Response("Kein Coverbild.", { status: 404 });
  }

  try {
    const bytes = await readFile(resolveCourseCoverPath(storageKey));

    return new Response(bytes, {
      headers: {
        "Content-Type": guessImageMimeType(storageKey),
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return new Response("Coverbild nicht gefunden.", { status: 404 });
  }
}
