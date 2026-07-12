import { adminGuardResponse } from "@/lib/admin/admin-api-utils";
import { jsonFromCourseResult, parseCourseJsonBody } from "@/lib/courses/course-api-utils";
import { createForum, listAdminForums } from "@/lib/forums/forum-service";
import type { ForumPermissionKind } from "@/lib/forums/forum-permission-kinds";
import {
  getNullableStringField,
  getStringField,
} from "@/lib/tools/recipe-api-utils";
import type { ForumPurpose } from "@prisma/client";

export async function GET(request: Request): Promise<Response> {
  const denied = await adminGuardResponse(request);

  if (denied) {
    return denied;
  }

  const forums = await listAdminForums();

  return jsonFromCourseResult({ success: true, data: forums });
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
  const permissionKind = getStringField(body, "permissionKind") as
    | ForumPermissionKind
    | null;

  if (!title || !permissionKind) {
    return jsonFromCourseResult({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Name und Berechtigungsart sind erforderlich.",
      },
    });
  }

  const result = await createForum({
    title,
    permissionKind,
    slug: getStringField(body, "slug") ?? undefined,
    description: getNullableStringField(body, "description"),
    forumPurpose:
      (getStringField(body, "forumPurpose") as ForumPurpose | null) ?? undefined,
    courseId:
      body.courseId === null
        ? null
        : (getStringField(body, "courseId") ?? undefined),
    writeEnabled:
      typeof body.writeEnabled === "boolean" ? body.writeEnabled : undefined,
    isActive:
      typeof body.isActive === "boolean" ? body.isActive : undefined,
    sortOrder:
      typeof body.sortOrder === "number" ? body.sortOrder : undefined,
  });

  return jsonFromCourseResult(result);
}
