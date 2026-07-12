import { readFile } from "node:fs/promises";

import { getSessionUserIdFromRequest } from "@/lib/auth/session";
import { getLessonDownloadForUser } from "@/lib/courses/course-learning-service";
import { resolveCourseDownloadPath } from "@/lib/courses/course-storage";
import { jsonFromCourseResult } from "@/lib/courses/course-api-utils";

type RouteContext = { params: Promise<{ lessonId: string }> };

export async function GET(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const userId = await getSessionUserIdFromRequest(request);

  if (!userId) {
    return jsonFromCourseResult({
      success: false,
      error: { code: "FORBIDDEN", message: "Anmeldung erforderlich." },
    });
  }

  const { lessonId } = await context.params;
  const result = await getLessonDownloadForUser(userId, lessonId);

  if (!result.success) {
    return jsonFromCourseResult(result);
  }

  if (!result.data) {
    return jsonFromCourseResult({
      success: false,
      error: { code: "NOT_FOUND", message: "Download nicht gefunden." },
    });
  }

  try {
    const absolutePath = resolveCourseDownloadPath(result.data.storageKey);
    const bytes = await readFile(absolutePath);

    return new Response(bytes, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${result.data.fileName}"`,
      },
    });
  } catch {
    return jsonFromCourseResult({
      success: false,
      error: { code: "NOT_FOUND", message: "Datei nicht gefunden." },
    });
  }
}
