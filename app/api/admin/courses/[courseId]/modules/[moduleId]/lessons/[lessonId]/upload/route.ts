import { adminGuardResponse } from "@/lib/admin/admin-api-utils";
import { updateCourseLesson } from "@/lib/courses/admin-course-service";
import { jsonFromCourseResult } from "@/lib/courses/course-api-utils";
import { saveCourseDownloadFile } from "@/lib/courses/course-storage";

type RouteContext = {
  params: Promise<{
    courseId: string;
    moduleId: string;
    lessonId: string;
  }>;
};

export async function POST(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const denied = await adminGuardResponse(request);

  if (denied) {
    return denied;
  }

  const { courseId, lessonId } = await context.params;
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return jsonFromCourseResult({
      success: false,
      error: { code: "VALIDATION_ERROR", message: "Datei ist erforderlich." },
    });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const saved = await saveCourseDownloadFile(
    courseId,
    lessonId,
    file.name,
    bytes,
  );

  const result = await updateCourseLesson(lessonId, {
    downloadStorageKey: saved.storageKey,
    downloadFileName: saved.fileName,
  });

  return jsonFromCourseResult(result);
}
