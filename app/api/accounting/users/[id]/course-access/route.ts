import { assertAccountingAccessFromRequest } from "@/lib/accounting/accounting-auth";
import { jsonFromAccountingResult } from "@/lib/accounting/accounting-api-utils";
import {
  extendUserCourseAccess,
  grantUserCourseAccess,
  listUserCourseAccessEntries,
  revokeUserCourseAccess,
} from "@/lib/courses/course-access-service";
import { listPublishedCourses } from "@/lib/courses/course-catalog-service";
import { parseCourseJsonBody, jsonFromCourseResult } from "@/lib/courses/course-api-utils";
import {
  getNullableStringField,
  getStringField,
} from "@/lib/tools/recipe-api-utils";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const access = await assertAccountingAccessFromRequest(request);

  if (!access.success) {
    return jsonFromAccountingResult(access);
  }

  const { id: userId } = await context.params;
  const entries = await listUserCourseAccessEntries(userId);
  const courses = await listPublishedCourses();

  return jsonFromAccountingResult({
    success: true,
    data: { entries, courses },
  });
}

export async function POST(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const access = await assertAccountingAccessFromRequest(request);

  if (!access.success) {
    return jsonFromAccountingResult(access);
  }

  const { id: userId } = await context.params;
  const bodyResult = await parseCourseJsonBody(request);

  if (!bodyResult.success) {
    return jsonFromCourseResult(bodyResult);
  }

  const body = bodyResult.data;
  const courseId = getStringField(body, "courseId");
  const action = getStringField(body, "action") ?? "grant";

  if (!courseId) {
    return jsonFromAccountingResult({
      success: false,
      error: { code: "VALIDATION_ERROR", message: "Kurs-ID erforderlich." },
    });
  }

  if (action === "revoke") {
    const result = await revokeUserCourseAccess(userId, courseId);

    return jsonFromAccountingResult(result);
  }

  if (action === "extend") {
    const expiresAt = getStringField(body, "expiresAt");

    if (!expiresAt) {
      return jsonFromAccountingResult({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Ablaufdatum erforderlich.",
        },
      });
    }

    const result = await extendUserCourseAccess(userId, courseId, expiresAt);

    return jsonFromAccountingResult(result);
  }

  const result = await grantUserCourseAccess(
    access.data.userId,
    userId,
    courseId,
    {
      expiresAt: getNullableStringField(body, "expiresAt"),
      note: getNullableStringField(body, "note"),
    },
  );

  return jsonFromAccountingResult(result);
}
