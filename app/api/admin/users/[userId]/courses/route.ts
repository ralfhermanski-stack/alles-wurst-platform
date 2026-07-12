import { assertAdminAccessFromRequest } from "@/lib/admin/admin-auth";
import { grantAdminUserCourse } from "@/lib/admin/admin-user-service";
import { jsonFromAuthResult, parseJsonBody } from "@/lib/auth/auth-api-utils";
import { listPublishedCourses } from "@/lib/courses/course-catalog-service";
import {
  getNullableStringField,
  getStringField,
} from "@/lib/tools/recipe-api-utils";

type RouteContext = { params: Promise<{ userId: string }> };

export async function GET(request: Request, context: RouteContext) {
  const access = await assertAdminAccessFromRequest(request);

  if (!access.success) {
    return jsonFromAuthResult(access);
  }

  const courses = await listPublishedCourses();

  return jsonFromAuthResult({
    success: true,
    data: courses,
  });
}

export async function POST(request: Request, context: RouteContext) {
  const access = await assertAdminAccessFromRequest(request);

  if (!access.success) {
    return jsonFromAuthResult(access);
  }

  const { userId } = await context.params;
  const body = await parseJsonBody(request);

  if (!body) {
    return jsonFromAuthResult({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Ungültiger Request-Body.",
      },
    });
  }

  const courseId = getStringField(body, "courseId");

  if (!courseId) {
    return jsonFromAuthResult({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Kurs-ID erforderlich.",
      },
    });
  }

  const result = await grantAdminUserCourse(
    userId,
    courseId,
    access.data.userId,
    {
      expiresAt: getNullableStringField(body, "expiresAt"),
      note: getNullableStringField(body, "note"),
    },
  );

  return jsonFromAuthResult(result);
}
