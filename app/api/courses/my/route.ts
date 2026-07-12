import { getSessionUserIdFromRequest } from "@/lib/auth/session";
import { listUserCourses } from "@/lib/courses/course-catalog-service";
import { jsonFromCourseResult } from "@/lib/courses/course-api-utils";

export async function GET(request: Request): Promise<Response> {
  const userId = await getSessionUserIdFromRequest(request);

  if (!userId) {
    return jsonFromCourseResult({
      success: false,
      error: { code: "FORBIDDEN", message: "Anmeldung erforderlich." },
    });
  }

  const result = await listUserCourses(userId);

  return jsonFromCourseResult(result);
}
