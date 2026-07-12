import { getSessionUserIdFromRequest } from "@/lib/auth/session";
import { updateLessonProgress } from "@/lib/courses/course-progress-service";
import { jsonFromCourseResult, parseCourseJsonBody } from "@/lib/courses/course-api-utils";
import { prisma } from "@/lib/db/prisma";

type RouteContext = {
  params: Promise<{ slug: string; lessonSlug: string }>;
};

export async function POST(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const userId = await getSessionUserIdFromRequest(request);

  if (!userId) {
    return jsonFromCourseResult({
      success: false,
      error: { code: "FORBIDDEN", message: "Anmeldung erforderlich." },
    });
  }

  const { slug, lessonSlug } = await context.params;
  const bodyResult = await parseCourseJsonBody(request);

  if (!bodyResult.success) {
    return jsonFromCourseResult(bodyResult);
  }

  const completed = bodyResult.data.completed === true;

  const course = await prisma.course.findUnique({
    where: { slug },
    include: {
      modules: { include: { lessons: true } },
    },
  });

  const lesson = course?.modules
    .flatMap((module) => module.lessons)
    .find((item) => item.slug === lessonSlug);

  if (!lesson) {
    return jsonFromCourseResult({
      success: false,
      error: { code: "NOT_FOUND", message: "Lektion nicht gefunden." },
    });
  }

  const result = await updateLessonProgress(userId, lesson.id, completed);

  return jsonFromCourseResult(result);
}
