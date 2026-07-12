import { staffGuardResponse } from "@/lib/admin/staff-api-utils";
import { jsonFromAuthResult } from "@/lib/auth/auth-api-utils";
import { parseCourseJsonBody } from "@/lib/courses/course-api-utils";
import {
  listAllSupportCategoriesAdmin,
  upsertSupportCategory,
} from "@/lib/support/support-ticket-service";
import { getStringField, getNullableStringField } from "@/lib/tools/recipe-api-utils";

export async function GET(request: Request): Promise<Response> {
  const denied = await staffGuardResponse(request);

  if (denied) {
    return denied;
  }

  const categories = await listAllSupportCategoriesAdmin();

  return jsonFromAuthResult({ success: true, data: categories });
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

  const name = getStringField(bodyResult.data, "name");
  const slug = getStringField(bodyResult.data, "slug");

  if (!name || !slug) {
    return jsonFromAuthResult({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Name und Slug sind erforderlich.",
      },
    });
  }

  const category = await upsertSupportCategory({
    id: getStringField(bodyResult.data, "id") ?? undefined,
    name,
    slug,
    description: getNullableStringField(bodyResult.data, "description"),
    sortOrder:
      typeof bodyResult.data.sortOrder === "number"
        ? bodyResult.data.sortOrder
        : undefined,
    isActive:
      typeof bodyResult.data.isActive === "boolean"
        ? bodyResult.data.isActive
        : undefined,
  });

  return jsonFromAuthResult({ success: true, data: category });
}
