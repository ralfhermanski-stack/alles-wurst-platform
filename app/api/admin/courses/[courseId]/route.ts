import { adminGuardResponse } from "@/lib/admin/admin-api-utils";
import {
  deleteCourse,
  getAdminCourse,
  updateCourse,
} from "@/lib/courses/admin-course-service";
import { jsonFromCourseResult, parseCourseJsonBody } from "@/lib/courses/course-api-utils";
import {
  getNullableStringField,
  getStringField,
} from "@/lib/tools/recipe-api-utils";
import type { CourseCertificateType, CourseStatus, CourseType } from "@prisma/client";

type RouteContext = { params: Promise<{ courseId: string }> };

export async function GET(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const denied = await adminGuardResponse(request);

  if (denied) {
    return denied;
  }

  const { courseId } = await context.params;
  const result = await getAdminCourse(courseId);

  return jsonFromCourseResult(result);
}

export async function PATCH(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const denied = await adminGuardResponse(request);

  if (denied) {
    return denied;
  }

  const { courseId } = await context.params;
  const bodyResult = await parseCourseJsonBody(request);

  if (!bodyResult.success) {
    return jsonFromCourseResult(bodyResult);
  }

  const body = bodyResult.data;

  const result = await updateCourse(courseId, {
    title: getStringField(body, "title") ?? undefined,
    slug: getStringField(body, "slug") ?? undefined,
    subtitle: getNullableStringField(body, "subtitle"),
    shortDescription: getNullableStringField(body, "shortDescription"),
    description: getNullableStringField(body, "description"),
    prerequisites: getNullableStringField(body, "prerequisites"),
    requiredEquipment: getNullableStringField(body, "requiredEquipment"),
    courseType: getStringField(body, "courseType") as CourseType | undefined,
    status: getStringField(body, "status") as CourseStatus | undefined,
    certificateType: getStringField(body, "certificateType") as
      | CourseCertificateType
      | undefined,
    certificateOverride:
      typeof body.certificateOverride === "boolean"
        ? body.certificateOverride
        : undefined,
    estimatedMinutes:
      typeof body.estimatedMinutes === "number"
        ? body.estimatedMinutes
        : body.estimatedMinutes === null
          ? null
          : undefined,
    priceCents:
      typeof body.priceCents === "number"
        ? body.priceCents
        : body.priceCents === null
          ? null
          : undefined,
    priceCurrency: getStringField(body, "priceCurrency") ?? undefined,
    featuredOnHomepage:
      typeof body.featuredOnHomepage === "boolean"
        ? body.featuredOnHomepage
        : undefined,
    homepageSortOrder:
      typeof body.homepageSortOrder === "number"
        ? body.homepageSortOrder
        : undefined,
    forumsEnabled:
      typeof body.forumsEnabled === "boolean" ? body.forumsEnabled : undefined,
    courseGroupId:
      body.courseGroupId === null
        ? null
        : getStringField(body, "courseGroupId") ?? undefined,
    courseSubgroupId:
      body.courseSubgroupId === null
        ? null
        : getStringField(body, "courseSubgroupId") ?? undefined,
    learningGoals: Array.isArray(body.learningGoals)
      ? body.learningGoals.filter((item): item is string => typeof item === "string")
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

  const { courseId } = await context.params;
  const result = await deleteCourse(courseId);

  return jsonFromCourseResult(result);
}
