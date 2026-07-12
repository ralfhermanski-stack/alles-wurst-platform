import { NextResponse } from "next/server";

import { assertAdminAccessFromRequest } from "@/lib/admin/admin-auth";
import {
  createEmailTemplate,
  getTemplateDetailForAdmin,
  listTemplatesForAdmin,
  sendAdminTestEmail,
  updateEmailTemplate,
} from "@/lib/email/admin-email-service";
import { emailGuardResponse } from "@/lib/email/email-api-utils";
import { ensureEmailSystemDefaults } from "@/lib/email/email-bootstrap";

import type { EmailCategory } from "@prisma/client";

export async function GET(request: Request): Promise<Response> {
  const denied = await emailGuardResponse(request, "email.view");

  if (denied) {
    return denied;
  }

  await ensureEmailSystemDefaults();

  const url = new URL(request.url);
  const id = url.searchParams.get("id");

  if (id) {
    const data = await getTemplateDetailForAdmin(id);

    if (!data) {
      return NextResponse.json(
        { success: false, error: { message: "Vorlage nicht gefunden." } },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data });
  }

  const data = await listTemplatesForAdmin();
  return NextResponse.json({ success: true, data });
}

export async function POST(request: Request): Promise<Response> {
  const denied = await emailGuardResponse(request, "email.templates.manage");

  if (denied) {
    return denied;
  }

  const access = await assertAdminAccessFromRequest(request);

  if (!access.success) {
    return NextResponse.json({ success: false, error: access.error }, { status: 401 });
  }

  const body = (await request.json()) as {
    action?: "create" | "save" | "test";
    id?: string;
    key?: string;
    name?: string;
    category?: EmailCategory;
    subject?: string;
    preheader?: string;
    htmlContent?: string;
    textContent?: string;
    allowedVariables?: string[];
    testRecipientEmail?: string;
  };

  if (body.action === "test") {
    if (!body.testRecipientEmail?.trim() || !body.key?.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "Testempfänger und Vorlagen-Schlüssel sind erforderlich." },
        },
        { status: 400 },
      );
    }

    try {
      await sendAdminTestEmail({
        recipientEmail: body.testRecipientEmail.trim(),
        templateKey: body.key.trim(),
        requestedByUserId: access.data.userId,
      });

      return NextResponse.json({
        success: true,
        message: "Test-E-Mail wurde versendet bzw. in die Warteschlange aufgenommen.",
      });
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: error instanceof Error ? error.message : "Testversand fehlgeschlagen.",
          },
        },
        { status: 400 },
      );
    }
  }

  if (body.action === "create") {
    if (!body.key?.trim() || !body.name?.trim() || !body.category) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "Schlüssel, Name und Kategorie sind erforderlich." },
        },
        { status: 400 },
      );
    }

    try {
      const row = await createEmailTemplate({
        key: body.key,
        name: body.name,
        category: body.category,
        subject: body.subject ?? "",
        preheader: body.preheader,
        htmlContent: body.htmlContent ?? "",
        textContent: body.textContent ?? "",
        allowedVariables: body.allowedVariables ?? [],
        createdById: access.data.userId,
      });

      return NextResponse.json({
        success: true,
        data: { id: row.id, key: row.key },
        message: "Vorlage angelegt.",
      });
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: error instanceof Error ? error.message : "Vorlage konnte nicht angelegt werden.",
          },
        },
        { status: 400 },
      );
    }
  }

  if (!body.id) {
    return NextResponse.json(
      { success: false, error: { message: "Vorlagen-ID fehlt." } },
      { status: 400 },
    );
  }

  try {
    const row = await updateEmailTemplate({
      id: body.id,
      name: body.name,
      category: body.category,
      subject: body.subject ?? "",
      preheader: body.preheader,
      htmlContent: body.htmlContent ?? "",
      textContent: body.textContent ?? "",
      allowedVariables: body.allowedVariables ?? [],
      updatedById: access.data.userId,
    });

    return NextResponse.json({
      success: true,
      data: { id: row.id, key: row.key },
      message: "Vorlage gespeichert.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : "Vorlage konnte nicht gespeichert werden.",
        },
      },
      { status: 400 },
    );
  }
}
