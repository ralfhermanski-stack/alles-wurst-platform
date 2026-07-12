import { adminGuardResponse } from "@/lib/admin/admin-api-utils";
import {
  listMembershipCourseRules,
  upsertMembershipCourseRule,
} from "@/lib/courses/admin-course-service";
import { jsonFromCourseResult, parseCourseJsonBody } from "@/lib/courses/course-api-utils";
import {
  getNullableStringField,
  getStringField,
} from "@/lib/tools/recipe-api-utils";
import type { BillingPeriod, MembershipRole } from "@prisma/client";

export async function GET(request: Request): Promise<Response> {
  const denied = await adminGuardResponse(request);

  if (denied) {
    return denied;
  }

  const rules = await listMembershipCourseRules();

  return jsonFromCourseResult({ success: true, data: rules });
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
  const membershipRole = getStringField(body, "membershipRole") as
    | MembershipRole
    | null;
  const courseId = getStringField(body, "courseId");

  if (!membershipRole || !courseId) {
    return jsonFromCourseResult({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Rolle und Kurs sind erforderlich.",
      },
    });
  }

  const result = await upsertMembershipCourseRule({
    membershipRole,
    courseId,
    billingPeriod: getStringField(body, "billingPeriod") as
      | BillingPeriod
      | undefined,
    active: typeof body.active === "boolean" ? body.active : undefined,
    note: getNullableStringField(body, "note"),
  });

  return jsonFromCourseResult(result);
}
