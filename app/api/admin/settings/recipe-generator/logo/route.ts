import { NextResponse } from "next/server";

import {
  adminGuardResponse,
  jsonFromServiceResult,
} from "@/lib/admin/admin-api-utils";
import {
  removeRecipePdfLogo,
  uploadRecipePdfLogo,
} from "@/lib/admin/admin-settings-service";
import {
  getRecipePdfLogoMaxBytes,
  isAllowedRecipePdfLogoMimeType,
} from "@/lib/tools/recipe-pdf-logo-storage";

/**
 * POST /api/admin/settings/recipe-generator/logo
 * Multipart-Feld: file
 */
export async function POST(request: Request): Promise<Response> {
  const guard = await adminGuardResponse(request);

  if (guard) {
    return guard;
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return jsonFromServiceResult({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Keine Datei übermittelt.",
      },
    });
  }

  if (!isAllowedRecipePdfLogoMimeType(file.type)) {
    return jsonFromServiceResult({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Nur JPEG, PNG oder WebP sind erlaubt.",
      },
    });
  }

  if (file.size > getRecipePdfLogoMaxBytes()) {
    return jsonFromServiceResult({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Das Bild darf maximal 5 MB groß sein.",
      },
    });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const result = await uploadRecipePdfLogo(file.name, file.type, bytes);

  if (!result.success) {
    return jsonFromServiceResult(result);
  }

  return NextResponse.json({ success: true, data: result.data });
}

/**
 * DELETE /api/admin/settings/recipe-generator/logo
 */
export async function DELETE(request: Request): Promise<Response> {
  const guard = await adminGuardResponse(request);

  if (guard) {
    return guard;
  }

  const result = await removeRecipePdfLogo();
  return jsonFromServiceResult(result);
}
