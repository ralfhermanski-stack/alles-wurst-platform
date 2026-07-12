import { adminGuardResponse } from "@/lib/admin/admin-api-utils";
import { jsonFromCourseResult, parseCourseJsonBody } from "@/lib/courses/course-api-utils";
import {
  deleteForum,
  getAdminForumById,
  updateForum,
} from "@/lib/forums/forum-service";
import type { ForumPermissionKind } from "@/lib/forums/forum-permission-kinds";
import {
  getNullableStringField,
  getStringField,
} from "@/lib/tools/recipe-api-utils";
import type { ForumPurpose } from "@prisma/client";

type RouteContext = { params: Promise<{ forumId: string }> };

export async function GET(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const denied = await adminGuardResponse(request);

  if (denied) {
    return denied;
  }

  const { forumId } = await context.params;
  const forum = await getAdminForumById(forumId);

  if (!forum) {
    return jsonFromCourseResult({
      success: false,
      error: { code: "NOT_FOUND", message: "Forum nicht gefunden." },
    });
  }

  return jsonFromCourseResult({ success: true, data: forum });
}

export async function PATCH(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const denied = await adminGuardResponse(request);

  if (denied) {
    return denied;
  }

  const { forumId } = await context.params;
  const bodyResult = await parseCourseJsonBody(request);

  if (!bodyResult.success) {
    return jsonFromCourseResult(bodyResult);
  }

  const body = bodyResult.data;

  const result = await updateForum(forumId, {
    title: getStringField(body, "title") ?? undefined,
    slug: getStringField(body, "slug") ?? undefined,
    description: getNullableStringField(body, "description"),
    permissionKind:
      (getStringField(body, "permissionKind") as ForumPermissionKind | null) ??
      undefined,
    forumPurpose:
      (getStringField(body, "forumPurpose") as ForumPurpose | undefined) ??
      undefined,
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

export async function DELETE(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const denied = await adminGuardResponse(request);

  if (denied) {
    return denied;
  }

  const { forumId } = await context.params;
  const result = await deleteForum(forumId);

  return jsonFromCourseResult(result);
}
