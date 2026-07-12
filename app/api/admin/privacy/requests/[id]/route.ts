import { adminGuardResponse } from "@/lib/admin/admin-api-utils";
import { jsonFromAuthResult } from "@/lib/auth/auth-api-utils";
import {
  getAdminPrivacyRequest,
  updatePrivacyRequestStatus,
} from "@/lib/privacy/admin-privacy-service";
import { parseJsonBody } from "@/lib/tools/recipe-api-utils";

import type { PrivacyRequestStatus } from "@prisma/client";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const denied = await adminGuardResponse(request);

  if (denied) {
    return denied;
  }

  const { id } = await context.params;
  const row = await getAdminPrivacyRequest(id);

  if (!row) {
    return jsonFromAuthResult({
      success: false,
      error: { code: "NOT_FOUND", message: "Anfrage nicht gefunden." },
    });
  }

  return jsonFromAuthResult({ success: true, data: row });
}

export async function PATCH(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const denied = await adminGuardResponse(request);

  if (denied) {
    return denied;
  }

  const { id } = await context.params;
  const body = await parseJsonBody(request);
  const status = body?.status as PrivacyRequestStatus | undefined;

  if (!status) {
    return jsonFromAuthResult({
      success: false,
      error: { code: "VALIDATION_ERROR", message: "Status fehlt." },
    });
  }

  const updated = await updatePrivacyRequestStatus({
    requestId: id,
    status,
    responseText:
      typeof body?.responseText === "string" ? body.responseText : undefined,
    rejectionReason:
      typeof body?.rejectionReason === "string" ? body.rejectionReason : undefined,
  });

  return jsonFromAuthResult({ success: true, data: updated });
}
