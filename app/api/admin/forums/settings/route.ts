import { adminGuardResponse } from "@/lib/admin/admin-api-utils";
import { jsonFromCourseResult } from "@/lib/courses/course-api-utils";
import {
  getMiniCourseGlobalForumsSetting,
  updateMiniCourseGlobalForumsSetting,
} from "@/lib/forums/forum-service";

export async function GET(request: Request): Promise<Response> {
  const denied = await adminGuardResponse(request);

  if (denied) {
    return denied;
  }

  const enabled = await getMiniCourseGlobalForumsSetting();

  return jsonFromCourseResult({ success: true, data: { enabled } });
}

export async function PATCH(request: Request): Promise<Response> {
  const denied = await adminGuardResponse(request);

  if (denied) {
    return denied;
  }

  const body = (await request.json()) as { enabled?: boolean };

  if (typeof body.enabled !== "boolean") {
    return jsonFromCourseResult({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "enabled muss ein Boolean sein.",
      },
    });
  }

  await updateMiniCourseGlobalForumsSetting(body.enabled);

  return jsonFromCourseResult({
    success: true,
    data: { enabled: body.enabled },
  });
}
