import { adminGuardResponse } from "@/lib/admin/admin-api-utils";
import { createCourseLesson } from "@/lib/courses/admin-course-service";
import { jsonFromCourseResult, parseCourseJsonBody } from "@/lib/courses/course-api-utils";
import {
  getNullableStringField,
  getStringField,
} from "@/lib/tools/recipe-api-utils";
import type { CourseLessonType } from "@prisma/client";

type RouteContext = {
  params: Promise<{ courseId: string; moduleId: string }>;
};

export async function POST(
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
  const title = getStringField(body, "title");
  const lessonType = getStringField(body, "lessonType") as CourseLessonType | null;

  if (!title || !lessonType) {
    return jsonFromCourseResult({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Titel und Lektionstyp sind erforderlich.",
      },
    });
  }

  const result = await createCourseLesson(moduleId, {
    title,
    slug: getStringField(body, "slug") ?? undefined,
    description: getNullableStringField(body, "description"),
    lessonType,
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
        : null,
    certificateProofType:
      body.certificateProofType === "participation" ||
      body.certificateProofType === "achievement"
        ? body.certificateProofType
        : undefined,
  });

  return jsonFromCourseResult(result);
}
