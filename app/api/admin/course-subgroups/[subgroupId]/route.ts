import { adminGuardResponse } from "@/lib/admin/admin-api-utils";
import {
  deleteCourseSubgroup,
  updateCourseSubgroup,
} from "@/lib/course-groups/course-group-service";
import { jsonFromCourseResult, parseCourseJsonBody } from "@/lib/courses/course-api-utils";
import {
  getNullableStringField,
  getStringField,
} from "@/lib/tools/recipe-api-utils";

type RouteContext = { params: Promise<{ subgroupId: string }> };

export async function PATCH(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const denied = await adminGuardResponse(request);

  if (denied) {
    return denied;
  }

  const { subgroupId } = await context.params;
  const bodyResult = await parseCourseJsonBody(request);

  if (!bodyResult.success) {
    return jsonFromCourseResult(bodyResult);
  }

  const body = bodyResult.data;

  const result = await updateCourseSubgroup(subgroupId, {
    courseGroupId: getStringField(body, "courseGroupId") ?? undefined,
    name: getStringField(body, "name") ?? undefined,
    slug: getStringField(body, "slug") ?? undefined,
    shortDescription: getNullableStringField(body, "shortDescription"),
    sortOrder:
      typeof body.sortOrder === "number" ? body.sortOrder : undefined,
    isActive: typeof body.isActive === "boolean" ? body.isActive : undefined,
  });

  return jsonFromCourseResult(result);
}

export async function DELETE(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const denied = await adminGuardResponse(request);

  if (denied) {
    return denied;
  }

  const { subgroupId } = await context.params;
  const result = await deleteCourseSubgroup(subgroupId);

  return jsonFromCourseResult(result);
}
