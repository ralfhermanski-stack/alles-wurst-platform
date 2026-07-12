import { adminGuardResponse } from "@/lib/admin/admin-api-utils";
import { jsonFromAuthResult } from "@/lib/auth/auth-api-utils";
import { getSessionUserIdFromRequest } from "@/lib/auth/session";
import { syncAllLegalDocuments, syncLegalDocument } from "@/lib/legal/legal-document-sync-service";
import { parseJsonBody } from "@/lib/tools/recipe-api-utils";

export async function POST(request: Request): Promise<Response> {
  const denied = await adminGuardResponse(request);

  if (denied) {
    return denied;
  }

  const userId = await getSessionUserIdFromRequest(request);
  const body = await parseJsonBody(request);
  const documentId =
    body && typeof body.documentId === "string" ? body.documentId : null;

  try {
    if (documentId) {
      const result = await syncLegalDocument(documentId, "manual", userId);
      return jsonFromAuthResult({ success: true, data: result });
    }

    const synced = await syncAllLegalDocuments("manual", userId);
    return jsonFromAuthResult({ success: true, data: { synced } });
  } catch {
    return jsonFromAuthResult({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Synchronisierung fehlgeschlagen.",
      },
    });
  }
}
