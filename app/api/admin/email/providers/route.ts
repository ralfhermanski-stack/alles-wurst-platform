import { NextResponse } from "next/server";

import {
  listProvidersForAdmin,
  testEmailProviderConnection,
  upsertEmailProvider,
} from "@/lib/email/admin-email-service";
import { emailGuardResponse } from "@/lib/email/email-api-utils";
import { prisma } from "@/lib/db/prisma";

import type { EmailProviderType } from "@prisma/client";

export async function GET(request: Request): Promise<Response> {
  const denied = await emailGuardResponse(request, "email.providers.manage");

  if (denied) {
    return denied;
  }

  const data = await listProvidersForAdmin();
  return NextResponse.json({ success: true, data });
}

export async function POST(request: Request): Promise<Response> {
  const denied = await emailGuardResponse(request, "email.providers.manage");

  if (denied) {
    return denied;
  }

  const body = (await request.json()) as {
    id?: string;
    name?: string;
    providerType?: EmailProviderType;
    active?: boolean;
    settings?: Record<string, unknown>;
    apiKey?: string;
    smtpPassword?: string;
    testRecipientEmail?: string;
    action?: "save" | "test";
  };

  if (body.action === "test") {
    if (!body.id || !body.testRecipientEmail) {
      return NextResponse.json(
        { success: false, error: { message: "Provider und Testempfänger erforderlich." } },
        { status: 400 },
      );
    }

    const result = await testEmailProviderConnection({
      providerId: body.id,
      testRecipientEmail: body.testRecipientEmail,
    });

    return NextResponse.json({ success: result.ok, data: result, error: result.ok ? undefined : { message: result.message } });
  }

  if (!body.name?.trim() || !body.providerType) {
    return NextResponse.json(
      { success: false, error: { message: "Name und Provider-Typ sind erforderlich." } },
      { status: 400 },
    );
  }

  if (body.active) {
    await prisma.emailProviderConfig.updateMany({
      where: { active: true, ...(body.id ? { id: { not: body.id } } : {}) },
      data: { active: false },
    });
  }

  const row = await upsertEmailProvider({
    id: body.id,
    name: body.name.trim(),
    providerType: body.providerType,
    active: body.active ?? false,
    settings: body.settings ?? {},
    apiKey: body.apiKey,
    smtpPassword: body.smtpPassword,
  });

  return NextResponse.json({
    success: true,
    data: { id: row.id },
    message: body.id ? "Provider aktualisiert." : "Provider angelegt.",
  });
}
