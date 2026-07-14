import { assertAdminAccessFromRequest } from "@/lib/admin/admin-auth";
import { hasAdminPermission } from "@/lib/admin/admin-permissions";
import { jsonFromAuthResult } from "@/lib/auth/auth-api-utils";
import {
  countBetaBroadcastRecipients,
  sendBetaBroadcastMessage,
  type BetaBroadcastAudience,
} from "@/lib/beta-test/beta-test-service";
import { parseJsonBody } from "@/lib/tools/recipe-api-utils";

function readAudience(value: unknown): BetaBroadcastAudience | null {
  if (value === "accepted" || value === "invited") {
    return value;
  }

  return null;
}

export async function GET(request: Request): Promise<Response> {
  const access = await assertAdminAccessFromRequest(request);

  if (!access.success) {
    return jsonFromAuthResult(access);
  }

  if (!hasAdminPermission(access.data.systemRole, "maintenance.bypass")) {
    return jsonFromAuthResult({
      success: false,
      error: {
        code: "FORBIDDEN",
        message: "Keine Berechtigung für Betatest-Nachrichten.",
      },
    });
  }

  const url = new URL(request.url);
  const audience = readAudience(url.searchParams.get("audience")) ?? "accepted";

  try {
    const recipientCount = await countBetaBroadcastRecipients(audience);

    return Response.json({
      success: true,
      data: { audience, recipientCount },
    });
  } catch (error) {
    console.error("[admin/beta-test/broadcast] GET failed:", error);

    return jsonFromAuthResult({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Empfänger konnten nicht gezählt werden.",
      },
    });
  }
}

export async function POST(request: Request): Promise<Response> {
  const access = await assertAdminAccessFromRequest(request);

  if (!access.success) {
    return jsonFromAuthResult(access);
  }

  if (!hasAdminPermission(access.data.systemRole, "maintenance.bypass")) {
    return jsonFromAuthResult({
      success: false,
      error: {
        code: "FORBIDDEN",
        message: "Keine Berechtigung für Betatest-Nachrichten.",
      },
    });
  }

  const body = await parseJsonBody(request);

  if (!body) {
    return jsonFromAuthResult({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Ungültiger JSON-Body.",
      },
    });
  }

  const subject = typeof body.subject === "string" ? body.subject : "";
  const message = typeof body.message === "string" ? body.message : "";
  const audience = readAudience(body.audience) ?? "accepted";
  const sendEmail = body.sendEmail !== false;
  const sendAccountMessage = body.sendAccountMessage !== false;

  try {
    const result = await sendBetaBroadcastMessage({
      subject,
      message,
      audience,
      sendEmail,
      sendAccountMessage,
      requestedByUserId: access.data.userId,
    });

    return Response.json({ success: true, data: result });
  } catch (error) {
    console.error("[admin/beta-test/broadcast] POST failed:", error);

    return jsonFromAuthResult({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message:
          error instanceof Error
            ? error.message
            : "Sammelnachricht konnte nicht versendet werden.",
      },
    });
  }
}
