import { adminGuardResponse } from "@/lib/admin/admin-api-utils";
import { assertAdminAccessFromRequest } from "@/lib/admin/admin-auth";
import { hasAdminPermission } from "@/lib/admin/admin-permissions";
import { jsonFromAuthResult } from "@/lib/auth/auth-api-utils";
import { getStripeAdminOverview as loadStripeOverview } from "@/lib/stripe/stripe-admin-service";
import {
  setStripeActiveMode,
  updateStripeKeyNotes,
} from "@/lib/stripe/stripe-settings-service";
import { parseJsonBody } from "@/lib/tools/recipe-api-utils";
import type { StripeActiveMode } from "@prisma/client";

export async function GET(request: Request): Promise<Response> {
  const denied = await adminGuardResponse(request);

  if (denied) {
    return denied;
  }

  try {
    const data = await loadStripeOverview();

    return Response.json({ success: true, data });
  } catch (error) {
    console.error("[admin/stripe] GET failed:", error);

    return jsonFromAuthResult({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Stripe-Status konnte nicht geladen werden.",
      },
    });
  }
}

export async function PATCH(request: Request): Promise<Response> {
  const access = await assertAdminAccessFromRequest(request);

  if (!access.success) {
    return jsonFromAuthResult(access);
  }

  if (!hasAdminPermission(access.data.systemRole, "settings.write")) {
    return jsonFromAuthResult({
      success: false,
      error: {
        code: "FORBIDDEN",
        message: "Keine Berechtigung für Stripe-Einstellungen.",
      },
    });
  }

  const body = (await parseJsonBody(request)) as {
    activeMode?: StripeActiveMode;
    keyStorageNoteTest?: string | null;
    keyStorageNoteLive?: string | null;
    keyRotatedAtTest?: string | null;
    keyRotatedAtLive?: string | null;
  } | null;

  if (!body) {
    return jsonFromAuthResult({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Ungültiger JSON-Body.",
      },
    });
  }

  try {
    if (body.activeMode) {
      if (body.activeMode !== "test" && body.activeMode !== "live") {
        return jsonFromAuthResult({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "activeMode muss 'test' oder 'live' sein.",
          },
        });
      }

      await setStripeActiveMode(body.activeMode);
    }

    if (
      "keyStorageNoteTest" in body ||
      "keyStorageNoteLive" in body ||
      "keyRotatedAtTest" in body ||
      "keyRotatedAtLive" in body
    ) {
      await updateStripeKeyNotes({
        keyStorageNoteTest: body.keyStorageNoteTest,
        keyStorageNoteLive: body.keyStorageNoteLive,
        keyRotatedAtTest: body.keyRotatedAtTest,
        keyRotatedAtLive: body.keyRotatedAtLive,
      });
    }

    const data = await loadStripeOverview();

    return Response.json({ success: true, data });
  } catch (error) {
    return jsonFromAuthResult({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message:
          error instanceof Error
            ? error.message
            : "Stripe-Einstellungen konnten nicht gespeichert werden.",
      },
    });
  }
}
