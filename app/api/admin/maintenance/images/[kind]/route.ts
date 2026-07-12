import { NextResponse } from "next/server";

import { adminGuardResponse } from "@/lib/admin/admin-api-utils";
import { assertAdminAccessFromRequest } from "@/lib/admin/admin-auth";
import { hasAdminPermission } from "@/lib/admin/admin-permissions";
import { jsonFromAuthResult } from "@/lib/auth/auth-api-utils";
import {
  getMaintenanceImageMaxBytes,
  isAllowedMaintenanceImageMimeType,
  type MaintenanceImageKind,
} from "@/lib/maintenance/maintenance-image-storage";
import {
  removeMaintenanceImage,
  uploadMaintenanceImage,
} from "@/lib/maintenance/maintenance-service";

type RouteContext = { params: Promise<{ kind: string }> };

function parseKind(value: string): MaintenanceImageKind | null {
  if (value === "logo" || value === "background") {
    return value;
  }

  return null;
}

export async function POST(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const denied = await adminGuardResponse(request);

  if (denied) {
    return denied;
  }

  const access = await assertAdminAccessFromRequest(request);

  if (!access.success) {
    return jsonFromAuthResult(access);
  }

  if (!hasAdminPermission(access.data.systemRole, "settings.write")) {
    return jsonFromAuthResult({
      success: false,
      error: {
        code: "FORBIDDEN",
        message: "Keine Berechtigung für Systemeinstellungen.",
      },
    });
  }

  const { kind: kindParam } = await context.params;
  const kind = parseKind(kindParam);

  if (!kind) {
    return jsonFromAuthResult({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Ungültiger Bildtyp. Erlaubt: logo, background.",
      },
    });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return jsonFromAuthResult({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Keine Datei übermittelt.",
      },
    });
  }

  if (!isAllowedMaintenanceImageMimeType(file.type)) {
    return jsonFromAuthResult({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Nur JPEG, PNG oder WebP sind erlaubt.",
      },
    });
  }

  if (file.size > getMaintenanceImageMaxBytes()) {
    return jsonFromAuthResult({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Das Bild darf maximal 5 MB groß sein.",
      },
    });
  }

  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const settings = await uploadMaintenanceImage(
      kind,
      file.name,
      file.type,
      bytes,
    );

    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    return jsonFromAuthResult({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: error instanceof Error ? error.message : "Upload fehlgeschlagen.",
      },
    });
  }
}

export async function DELETE(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const denied = await adminGuardResponse(request);

  if (denied) {
    return denied;
  }

  const access = await assertAdminAccessFromRequest(request);

  if (!access.success) {
    return jsonFromAuthResult(access);
  }

  if (!hasAdminPermission(access.data.systemRole, "settings.write")) {
    return jsonFromAuthResult({
      success: false,
      error: {
        code: "FORBIDDEN",
        message: "Keine Berechtigung für Systemeinstellungen.",
      },
    });
  }

  const { kind: kindParam } = await context.params;
  const kind = parseKind(kindParam);

  if (!kind) {
    return jsonFromAuthResult({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Ungültiger Bildtyp.",
      },
    });
  }

  try {
    const settings = await removeMaintenanceImage(kind);
    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    return jsonFromAuthResult({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: error instanceof Error ? error.message : "Löschen fehlgeschlagen.",
      },
    });
  }
}
