/**
 * @file app/api/admin/page-editor/image/route.ts
 */

import { jsonFromPageEditorResult } from "@/lib/page-editor/page-editor-api-utils";
import { assertPageEditorApiAccess } from "@/lib/page-editor/page-editor-api-guard";
import { savePageEditorDraft } from "@/lib/page-editor/page-editor-service";
import {
  getPlatformImageMaxBytes,
  isAllowedPlatformImageMimeType,
  savePlatformImage,
} from "@/lib/platform-media/platform-image-storage";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  const access = await assertPageEditorApiAccess(request);

  if (!access.ok) {
    return access.response;
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const pageId = formData.get("pageId");
    const textKey = formData.get("textKey");

    if (!(file instanceof File) || typeof pageId !== "string" || typeof textKey !== "string") {
      return jsonFromPageEditorResult({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "pageId, textKey und file sind erforderlich.",
        },
      });
    }

    if (!isAllowedPlatformImageMimeType(file.type)) {
      return jsonFromPageEditorResult({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Nur JPEG, PNG oder WebP sind erlaubt.",
        },
      });
    }

    if (file.size > getPlatformImageMaxBytes()) {
      return jsonFromPageEditorResult({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Das Bild darf maximal 5 MB groß sein.",
        },
      });
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const url = await savePlatformImage({
      textKey,
      fileName: file.name,
      mimeType: file.type,
      bytes,
    });

    const saved = await savePageEditorDraft({
      pageId,
      textKey,
      value: url,
      userId: access.actor.userId,
    });

    if (!saved.success) {
      return jsonFromPageEditorResult(saved);
    }

    return jsonFromPageEditorResult({
      success: true,
      data: {
        url,
        textKey: saved.data.textKey,
        draftValue: saved.data.draftValue,
      },
    });
  } catch (error) {
    console.error("[page-editor/image] upload:", error);
    return jsonFromPageEditorResult({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message:
          error instanceof Error ? error.message : "Bild konnte nicht hochgeladen werden.",
      },
    });
  }
}
