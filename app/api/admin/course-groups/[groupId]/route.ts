import { adminGuardResponse } from "@/lib/admin/admin-api-utils";
import {
  deleteCourseGroup,
  updateCourseGroup,
} from "@/lib/course-groups/course-group-service";
import { jsonFromCourseResult, parseCourseJsonBody } from "@/lib/courses/course-api-utils";
import {
  getNullableStringField,
  getStringField,
} from "@/lib/tools/recipe-api-utils";

type RouteContext = { params: Promise<{ groupId: string }> };

export async function PATCH(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const denied = await adminGuardResponse(request);

  if (denied) {
    return denied;
  }

  const { groupId } = await context.params;
  const bodyResult = await parseCourseJsonBody(request);

  if (!bodyResult.success) {
    return jsonFromCourseResult(bodyResult);
  }

  const body = bodyResult.data;

  const result = await updateCourseGroup(groupId, {
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

  const { groupId } = await context.params;
  const result = await deleteCourseGroup(groupId);

  return jsonFromCourseResult(result);
}
