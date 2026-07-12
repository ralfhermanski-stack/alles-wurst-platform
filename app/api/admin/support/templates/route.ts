import { staffGuardResponse } from "@/lib/admin/staff-api-utils";
import { jsonFromAuthResult } from "@/lib/auth/auth-api-utils";
import { parseCourseJsonBody } from "@/lib/courses/course-api-utils";
import { listSupportTemplates, upsertSupportTemplate } from "@/lib/support/support-ticket-service";
import { getStringField } from "@/lib/tools/recipe-api-utils";

export async function GET(request: Request): Promise<Response> {
  const denied = await staffGuardResponse(request);

  if (denied) {
    return denied;
  }

  const templates = await listSupportTemplates();

  return jsonFromAuthResult({ success: true, data: templates });
}

export async function POST(request: Request): Promise<Response> {
  const denied = await staffGuardResponse(request);

  if (denied) {
    return denied;
  }

  const bodyResult = await parseCourseJsonBody(request);

  if (!bodyResult.success) {
    return jsonFromAuthResult(bodyResult);
  }

  const title = getStringField(bodyResult.data, "title");
  const body = getStringField(bodyResult.data, "body");

  if (!title || !body) {
    return jsonFromAuthResult({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Titel und Text sind erforderlich.",
      },
    });
  }

  const template = await upsertSupportTemplate({
    id: getStringField(bodyResult.data, "id") ?? undefined,
    title,
    body,
    categoryId: getStringField(bodyResult.data, "categoryId") ?? null,
    sortOrder:
      typeof bodyResult.data.sortOrder === "number"
        ? bodyResult.data.sortOrder
        : undefined,
    isActive:
      typeof bodyResult.data.isActive === "boolean"
        ? bodyResult.data.isActive
        : undefined,
  });

  return jsonFromAuthResult({ success: true, data: template });
}
