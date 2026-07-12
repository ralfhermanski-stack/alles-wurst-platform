import { NextResponse } from "next/server";

import { assertAdminAccessFromRequest } from "@/lib/admin/admin-auth";
import { jsonFromAuthResult } from "@/lib/auth/auth-api-utils";
import { sendAdminTestEmail, sendStaffManualEmail } from "@/lib/email/admin-email-service";
import { emailGuardResponse } from "@/lib/email/email-api-utils";
import { canSendEmailCategory } from "@/lib/email/email-permissions";

import type { EmailCategory } from "@prisma/client";

export async function POST(request: Request): Promise<Response> {
  const denied = await emailGuardResponse(request, "email.send");

  if (denied) {
    return denied;
  }

  const access = await assertAdminAccessFromRequest(request);

  if (!access.success) {
    return jsonFromAuthResult(access);
  }

  const body = (await request.json()) as {
    mode?: "test" | "manual";
    recipientEmail?: string;
    recipientUserId?: string;
    templateKey?: string;
    category?: EmailCategory;
    variables?: Record<string, string>;
  };

  try {
    if (body.mode === "test") {
      if (!body.recipientEmail) {
        return NextResponse.json(
          { success: false, error: { message: "Testempfänger fehlt." } },
          { status: 400 },
        );
      }

      const result = await sendAdminTestEmail({
        recipientEmail: body.recipientEmail,
        templateKey: body.templateKey,
        requestedByUserId: access.data.userId,
      });

      return NextResponse.json({
        success: true,
        data: result,
        message: "Die E-Mail wurde in die Warteschlange aufgenommen.",
      });
    }

    if (!body.recipientUserId || !body.templateKey || !body.category) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "Empfänger, Kategorie und Vorlage sind erforderlich." },
        },
        { status: 400 },
      );
    }

    if (!canSendEmailCategory(access.data.systemRole, body.category)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Benutzer können keine E-Mails an andere Benutzer senden.",
          },
        },
        { status: 403 },
      );
    }

    const result = await sendStaffManualEmail({
      recipientUserId: body.recipientUserId,
      category: body.category,
      templateKey: body.templateKey,
      variables: body.variables,
      requestedByUserId: access.data.userId,
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: "Die E-Mail wurde erfolgreich in die Warteschlange aufgenommen.",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Versand fehlgeschlagen.";

    return NextResponse.json(
      { success: false, error: { message } },
      { status: 400 },
    );
  }
}
