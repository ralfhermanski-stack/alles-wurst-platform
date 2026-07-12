import { adminGuardResponse } from "@/lib/admin/admin-api-utils";
import { updateCourseSubgroupImage } from "@/lib/course-groups/course-group-service";
import { isAllowedCourseGroupImageFile } from "@/lib/course-groups/course-group-storage";
import { jsonFromCourseResult } from "@/lib/courses/course-api-utils";

type RouteContext = { params: Promise<{ subgroupId: string }> };

export async function POST(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const denied = await adminGuardResponse(request);

  if (denied) {
    return denied;
  }

  const { subgroupId } = await context.params;
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return jsonFromCourseResult({
      success: false,
      error: { code: "VALIDATION_ERROR", message: "Bilddatei erforderlich." },
    });
  }

  if (!isAllowedCourseGroupImageFile(file.name, file.type)) {
    return jsonFromCourseResult({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Nur JPG, PNG oder WebP sind erlaubt.",
      },
    });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const result = await updateCourseSubgroupImage(subgroupId, file.name, bytes);

  return jsonFromCourseResult(result);
}
