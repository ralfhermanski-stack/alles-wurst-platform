import { adminGuardResponse } from "@/lib/admin/admin-api-utils";
import {
  deleteCourseLesson,
  updateCourseLesson,
} from "@/lib/courses/admin-course-service";
import { jsonFromCourseResult, parseCourseJsonBody } from "@/lib/courses/course-api-utils";
import {
  getNullableStringField,
  getStringField,
} from "@/lib/tools/recipe-api-utils";
import type { CourseLessonType } from "@prisma/client";

type RouteContext = {
  params: Promise<{
    courseId: string;
    moduleId: string;
    lessonId: string;
  }>;
};

export async function PATCH(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const denied = await adminGuardResponse(request);

  if (denied) {
    return denied;
  }

  const { lessonId } = await context.params;
  const bodyResult = await parseCourseJsonBody(request);

  if (!bodyResult.success) {
    return jsonFromCourseResult(bodyResult);
  }

  const body = bodyResult.data;

  const result = await updateCourseLesson(lessonId, {
    title: getStringField(body, "title") ?? undefined,
    slug: getStringField(body, "slug") ?? undefined,
    description: getNullableStringField(body, "description"),
    lessonType: getStringField(body, "lessonType") as CourseLessonType | undefined,
    durationMinutes:
      typeof body.durationMinutes === "number"
        ? body.durationMinutes
        : undefined,
    textContent: getNullableStringField(body, "textContent"),
    vimeoVideoId: getNullableStringField(body, "vimeoVideoId"),
    recipeId: getNullableStringField(body, "recipeId"),
    recipeTitle: getNullableStringField(body, "recipeTitle"),
    recipeContent:
      typeof body.recipeContent === "object" && body.recipeContent !== null
        ? (body.recipeContent as Record<string, unknown>)
        : undefined,
    certificateProofType:
      body.certificateProofType === "participation" ||
      body.certificateProofType === "achievement"
        ? body.certificateProofType
        : undefined,
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

  const { lessonId } = await context.params;
  const result = await deleteCourseLesson(lessonId);

  return jsonFromCourseResult(result);
}
