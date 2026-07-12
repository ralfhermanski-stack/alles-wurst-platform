import { adminGuardResponse } from "@/lib/admin/admin-api-utils";
import { assertAdminAccessFromRequest } from "@/lib/admin/admin-auth";
import { hasAdminPermission } from "@/lib/admin/admin-permissions";
import { jsonFromAuthResult } from "@/lib/auth/auth-api-utils";
import { getStripeAdminOverview as loadStripeOverview } from "@/lib/stripe/stripe-admin-service";
import { saveStripeKeysInAdmin } from "@/lib/stripe/stripe-key-store";
import { parseJsonBody, getStringField } from "@/lib/tools/recipe-api-utils";
import type { StripeActiveMode } from "@prisma/client";

export async function POST(request: Request): Promise<Response> {
  const access = await assertAdminAccessFromRequest(request);

  if (!access.success) {
    return jsonFromAuthResult(access);
  }

  if (!hasAdminPermission(access.data.systemRole, "settings.write")) {
    return jsonFromAuthResult({
      success: false,
      error: {
        code: "FORBIDDEN",
        message: "Keine Berechtigung für Stripe-Schlüssel.",
      },
    });
  }

  const body = await parseJsonBody(request);
  const modeRaw = body ? getStringField(body, "mode") : null;
  const mode = modeRaw === "live" || modeRaw === "test" ? modeRaw : null;
  const publishableKey = body ? getStringField(body, "publishableKey") : null;
  const serverKey = body ? getStringField(body, "serverKey") : null;
  const webhookSecret = body ? getStringField(body, "webhookSecret") : null;

  if (!mode || !publishableKey || !serverKey || !webhookSecret) {
    return jsonFromAuthResult({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message:
          "Modus, öffentlicher Schlüssel, Server-Schlüssel und Webhook-Geheimnis sind erforderlich.",
      },
    });
  }

  try {
    await saveStripeKeysInAdmin({
      mode: mode as StripeActiveMode,
      publishableKey,
      serverKey,
      webhookSecret,
    });

    const data = await loadStripeOverview();

    return Response.json({
      success: true,
      data,
      message: "Stripe-Schlüssel wurden gespeichert. Sie werden nicht erneut angezeigt.",
    });
  } catch (error) {
    return jsonFromAuthResult({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message:
          error instanceof Error
            ? error.message
            : "Stripe-Schlüssel konnten nicht gespeichert werden.",
      },
    });
  }
}
