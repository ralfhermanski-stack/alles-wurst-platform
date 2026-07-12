import { adminGuardResponse } from "@/lib/admin/admin-api-utils";
import {
  deleteCourseModule,
  updateCourseModule,
} from "@/lib/courses/admin-course-service";
import { jsonFromCourseResult, parseCourseJsonBody } from "@/lib/courses/course-api-utils";
import {
  getNullableStringField,
  getStringField,
} from "@/lib/tools/recipe-api-utils";

type RouteContext = {
  params: Promise<{ courseId: string; moduleId: string }>;
};

export async function PATCH(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const denied = await adminGuardResponse(request);

  if (denied) {
    return denied;
  }

  const { moduleId } = await context.params;
  const bodyResult = await parseCourseJsonBody(request);

  if (!bodyResult.success) {
    return jsonFromCourseResult(bodyResult);
  }

  const body = bodyResult.data;

  const result = await updateCourseModule(moduleId, {
    title: getStringField(body, "title") ?? undefined,
    description: getNullableStringField(body, "description"),
    sortOrder:
      typeof body.sortOrder === "number" ? body.sortOrder : undefined,
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

  const { moduleId } = await context.params;
  const result = await deleteCourseModule(moduleId);

  return jsonFromCourseResult(result);
}
