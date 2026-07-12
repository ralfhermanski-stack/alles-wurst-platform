import { adminGuardResponse } from "@/lib/admin/admin-api-utils";
import {
  createCourseSubgroup,
  listCourseSubgroups,
} from "@/lib/course-groups/course-group-service";
import { jsonFromCourseResult, parseCourseJsonBody } from "@/lib/courses/course-api-utils";
import {
  getNullableStringField,
  getStringField,
} from "@/lib/tools/recipe-api-utils";

export async function GET(request: Request): Promise<Response> {
  const denied = await adminGuardResponse(request);

  if (denied) {
    return denied;
  }

  const url = new URL(request.url);
  const courseGroupId = url.searchParams.get("courseGroupId") ?? undefined;
  const activeOnly = url.searchParams.get("activeOnly") === "true";
  const subgroups = await listCourseSubgroups({ courseGroupId, activeOnly });

  return jsonFromCourseResult({ success: true, data: subgroups });
}

export async function POST(request: Request): Promise<Response> {
  const denied = await adminGuardResponse(request);

  if (denied) {
    return denied;
  }

  const bodyResult = await parseCourseJsonBody(request);

  if (!bodyResult.success) {
    return jsonFromCourseResult(bodyResult);
  }

  const body = bodyResult.data;
  const name = getStringField(body, "name");
  const courseGroupId = getStringField(body, "courseGroupId");

  if (!name || !courseGroupId) {
    return jsonFromCourseResult({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Name und Hauptgruppe sind erforderlich.",
      },
    });
  }

  const result = await createCourseSubgroup({
    courseGroupId,
    name,
    slug: getStringField(body, "slug") ?? undefined,
    shortDescription: getNullableStringField(body, "shortDescription"),
    sortOrder:
      typeof body.sortOrder === "number" ? body.sortOrder : undefined,
    isActive: typeof body.isActive === "boolean" ? body.isActive : undefined,
  });

  return jsonFromCourseResult(result, 201);
}
