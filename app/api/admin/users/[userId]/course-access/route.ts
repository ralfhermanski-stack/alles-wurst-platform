import { adminGuardResponse } from "@/lib/admin/admin-api-utils";
import { assertAdminAccessFromRequest } from "@/lib/admin/admin-auth";
import {
  extendUserCourseAccess,
  grantUserCourseAccess,
  listUserCourseAccessEntries,
} from "@/lib/courses/course-access-service";
import { jsonFromCourseResult, parseCourseJsonBody } from "@/lib/courses/course-api-utils";
import {
  getNullableStringField,
  getStringField,
} from "@/lib/tools/recipe-api-utils";

type RouteContext = { params: Promise<{ userId: string }> };

export async function GET(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const denied = await adminGuardResponse(request);

  if (denied) {
    return denied;
  }

  const { userId } = await context.params;
  const entries = await listUserCourseAccessEntries(userId);

  return jsonFromCourseResult({ success: true, data: entries });
}

export async function POST(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const access = await assertAdminAccessFromRequest(request);

  if (!access.success) {
    return jsonFromCourseResult(access);
  }

  const { userId } = await context.params;
  const bodyResult = await parseCourseJsonBody(request);

  if (!bodyResult.success) {
    return jsonFromCourseResult(bodyResult);
  }

  const body = bodyResult.data;
  const courseId = getStringField(body, "courseId");
  const action = getStringField(body, "action") ?? "grant";

  if (!courseId) {
    return jsonFromCourseResult({
      success: false,
      error: { code: "VALIDATION_ERROR", message: "Kurs-ID erforderlich." },
    });
  }

  if (action === "extend") {
    const expiresAt = getStringField(body, "expiresAt");

    if (!expiresAt) {
      return jsonFromCourseResult({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Ablaufdatum erforderlich.",
        },
      });
    }

    const result = await extendUserCourseAccess(userId, courseId, expiresAt);

    return jsonFromCourseResult(result);
  }

  const result = await grantUserCourseAccess(access.data.userId, userId, courseId, {
    expiresAt: getNullableStringField(body, "expiresAt"),
    note: getNullableStringField(body, "note"),
  });

  return jsonFromCourseResult(result);
}
