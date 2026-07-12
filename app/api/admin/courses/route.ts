import { adminGuardResponse } from "@/lib/admin/admin-api-utils";
import {
  createCourse,
  listAdminCourses,
} from "@/lib/courses/admin-course-service";
import { jsonFromCourseResult, parseCourseJsonBody } from "@/lib/courses/course-api-utils";
import {
  getStringField,
} from "@/lib/tools/recipe-api-utils";
import type { CourseCertificateType, CourseType } from "@prisma/client";

export async function GET(request: Request): Promise<Response> {
  const denied = await adminGuardResponse(request);

  if (denied) {
    return denied;
  }

  const courses = await listAdminCourses();

  return jsonFromCourseResult({ success: true, data: courses });
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
  const title = getStringField(body, "title");

  if (!title) {
    return jsonFromCourseResult({
      success: false,
      error: { code: "VALIDATION_ERROR", message: "Titel ist erforderlich." },
    });
  }

  const courseType = getStringField(body, "courseType") as CourseType | null;

  if (!courseType) {
    return jsonFromCourseResult({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Kurstyp ist erforderlich.",
      },
    });
  }

  const result = await createCourse({
    title,
    slug: getStringField(body, "slug") ?? undefined,
    subtitle: getStringField(body, "subtitle"),
    shortDescription: getStringField(body, "shortDescription"),
    description: getStringField(body, "description"),
    prerequisites: getStringField(body, "prerequisites"),
    requiredEquipment: getStringField(body, "requiredEquipment"),
    courseType,
    certificateType:
      (getStringField(body, "certificateType") as CourseCertificateType | null) ??
      undefined,
    certificateOverride:
      typeof body.certificateOverride === "boolean"
        ? body.certificateOverride
        : undefined,
    priceCents:
      typeof body.priceCents === "number" ? body.priceCents : undefined,
    priceCurrency: getStringField(body, "priceCurrency") ?? undefined,
    featuredOnHomepage:
      typeof body.featuredOnHomepage === "boolean"
        ? body.featuredOnHomepage
        : undefined,
    homepageSortOrder:
      typeof body.homepageSortOrder === "number"
        ? body.homepageSortOrder
        : undefined,
    learningGoals: Array.isArray(body.learningGoals)
      ? body.learningGoals.filter((item): item is string => typeof item === "string")
      : [],
  });

  return jsonFromCourseResult(result);
}
