import { adminGuardResponse } from "@/lib/admin/admin-api-utils";
import { jsonFromAuthResult } from "@/lib/auth/auth-api-utils";
import { updateLegalDocumentSettings } from "@/lib/legal/legal-document-service";
import type { LegalDocumentIntegrationMode } from "@prisma/client";
import { parseJsonBody } from "@/lib/tools/recipe-api-utils";

type RouteContext = {
  params: Promise<{ documentId: string }>;
};

const INTEGRATION_MODES: LegalDocumentIntegrationMode[] = [
  "MANUAL",
  "HTML_SYNC",
  "TEXT_SYNC",
  "API_SYNC",
  "WEBHOOK",
  "IFRAME_PREVIEW_ONLY",
];

export async function PATCH(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const denied = await adminGuardResponse(request);

  if (denied) {
    return denied;
  }

  const { documentId } = await context.params;
  const body = await parseJsonBody(request);

  if (!body) {
    return jsonFromAuthResult({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Ungültiger Request-Body.",
      },
    });
  }

  const integrationMode =
    typeof body.integrationMode === "string" &&
    INTEGRATION_MODES.includes(body.integrationMode as LegalDocumentIntegrationMode)
      ? (body.integrationMode as LegalDocumentIntegrationMode)
      : undefined;

  try {
    const updated = await updateLegalDocumentSettings(documentId, {
      providerName:
        body.providerName === null
          ? null
          : typeof body.providerName === "string"
            ? body.providerName
            : undefined,
      externalUrl:
        body.externalUrl === null
          ? null
          : typeof body.externalUrl === "string"
            ? body.externalUrl
            : undefined,
      externalDocumentId:
        body.externalDocumentId === null
          ? null
          : typeof body.externalDocumentId === "string"
            ? body.externalDocumentId
            : undefined,
      integrationMode,
      autoPublish:
        typeof body.autoPublish === "boolean" ? body.autoPublish : undefined,
      publicVisible:
        typeof body.publicVisible === "boolean" ? body.publicVisible : undefined,
    });

    return jsonFromAuthResult({ success: true, data: updated });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Speichern fehlgeschlagen.";

    return jsonFromAuthResult({
      success: false,
      error: { code: "VALIDATION_ERROR", message },
    });
  }
}
