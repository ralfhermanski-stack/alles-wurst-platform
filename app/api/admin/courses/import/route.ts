import { adminGuardResponse } from "@/lib/admin/admin-api-utils";
import { importCourseFromJson } from "@/lib/courses/admin-course-service";
import {
  jsonFromCourseResult,
  parseCourseJsonBody,
} from "@/lib/courses/course-api-utils";
import { parseCourseImportPayload } from "@/lib/courses/course-import-types";

export async function POST(request: Request): Promise<Response> {
  const denied = await adminGuardResponse(request);

  if (denied) {
    return denied;
  }

  const bodyResult = await parseCourseJsonBody(request);

  if (!bodyResult.success) {
    return jsonFromCourseResult(bodyResult);
  }

  const parsed = parseCourseImportPayload(bodyResult.data);

  if (!parsed.success) {
    return jsonFromCourseResult({
      success: false,
      error: { code: "VALIDATION_ERROR", message: parsed.message },
    });
  }

  const result = await importCourseFromJson(parsed.data);

  return jsonFromCourseResult(result, result.success ? 201 : undefined);
}
