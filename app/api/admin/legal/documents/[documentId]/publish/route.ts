import { adminGuardResponse } from "@/lib/admin/admin-api-utils";
import { jsonFromAuthResult } from "@/lib/auth/auth-api-utils";
import { getSessionUserIdFromRequest } from "@/lib/auth/session";
import { publishLegalDocumentVersion } from "@/lib/legal/legal-document-service";
import { parseJsonBody } from "@/lib/tools/recipe-api-utils";

type RouteContext = {
  params: Promise<{ documentId: string }>;
};

export async function POST(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const denied = await adminGuardResponse(request);

  if (denied) {
    return denied;
  }

  const userId = await getSessionUserIdFromRequest(request);

  if (!userId) {
    return jsonFromAuthResult({
      success: false,
      error: { code: "UNAUTHORIZED", message: "Nicht angemeldet." },
    });
  }

  const { documentId } = await context.params;
  const body = await parseJsonBody(request);
  const versionId =
    body && typeof body.versionId === "string" ? body.versionId : null;

  if (!versionId) {
    return jsonFromAuthResult({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "versionId ist erforderlich.",
      },
    });
  }

  try {
    await publishLegalDocumentVersion(documentId, versionId, userId);
    return jsonFromAuthResult({ success: true, data: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Veröffentlichung fehlgeschlagen.";

    return jsonFromAuthResult({
      success: false,
      error: { code: "INTERNAL_ERROR", message },
    });
  }
}
