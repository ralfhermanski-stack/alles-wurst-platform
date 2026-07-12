import { adminGuardResponse } from "@/lib/admin/admin-api-utils";
import { updateCourseCover } from "@/lib/courses/admin-course-service";
import { jsonFromCourseResult } from "@/lib/courses/course-api-utils";
import { saveCourseCover } from "@/lib/courses/course-cover-storage";

type RouteContext = { params: Promise<{ courseId: string }> };

export async function POST(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const denied = await adminGuardResponse(request);

  if (denied) {
    return denied;
  }

  const { courseId } = await context.params;
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return jsonFromCourseResult({
      success: false,
      error: { code: "VALIDATION_ERROR", message: "Bilddatei ist erforderlich." },
    });
  }

  if (!file.type.startsWith("image/")) {
    return jsonFromCourseResult({
      success: false,
      error: { code: "VALIDATION_ERROR", message: "Nur Bilddateien sind erlaubt." },
    });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const saved = await saveCourseCover(courseId, file.name, bytes);

  const result = await updateCourseCover(
    courseId,
    saved.storageKey,
    saved.fileName,
  );

  return jsonFromCourseResult(result);
}
