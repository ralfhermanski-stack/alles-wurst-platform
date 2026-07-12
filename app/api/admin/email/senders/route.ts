import { NextResponse } from "next/server";

import {
  listCategoryConfigsForAdmin,
  listSendersForAdmin,
  updateCategoryDefaultSender,
  upsertEmailSender,
} from "@/lib/email/admin-email-service";
import { emailGuardResponse } from "@/lib/email/email-api-utils";

import type { EmailCategory } from "@prisma/client";

export async function GET(request: Request): Promise<Response> {
  const denied = await emailGuardResponse(request, "email.manage");

  if (denied) {
    return denied;
  }

  const url = new URL(request.url);
  const includeCategories = url.searchParams.get("categories") === "1";

  const senders = await listSendersForAdmin();

  if (!includeCategories) {
    return NextResponse.json({ success: true, data: senders });
  }

  const categories = await listCategoryConfigsForAdmin();
  return NextResponse.json({ success: true, data: { senders, categories } });
}

export async function POST(request: Request): Promise<Response> {
  const denied = await emailGuardResponse(request, "email.manage");

  if (denied) {
    return denied;
  }

  const body = (await request.json()) as {
    action?: "save-sender" | "assign-category";
    id?: string;
    providerConfigId?: string;
    internalName?: string;
    displayName?: string;
    emailAddress?: string;
    replyToAddress?: string;
    active?: boolean;
    verified?: boolean;
    defaultSender?: boolean;
    allowedCategories?: EmailCategory[];
    sortOrder?: number;
    category?: EmailCategory;
    defaultSenderId?: string | null;
  };

  if (body.action === "assign-category") {
    if (!body.category) {
      return NextResponse.json(
        { success: false, error: { message: "Kategorie fehlt." } },
        { status: 400 },
      );
    }

    await updateCategoryDefaultSender({
      category: body.category,
      defaultSenderId: body.defaultSenderId ?? null,
    });

    return NextResponse.json({
      success: true,
      message: "Kategorie-Zuordnung gespeichert.",
    });
  }

  if (
    !body.providerConfigId?.trim() ||
    !body.internalName?.trim() ||
    !body.displayName?.trim() ||
    !body.emailAddress?.trim()
  ) {
    return NextResponse.json(
      {
        success: false,
        error: { message: "Provider, interner Name, Anzeigename und E-Mail sind erforderlich." },
      },
      { status: 400 },
    );
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(body.emailAddress.trim())) {
    return NextResponse.json(
      { success: false, error: { message: "Ungültige E-Mail-Adresse." } },
      { status: 400 },
    );
  }

  if (body.replyToAddress?.trim() && !emailPattern.test(body.replyToAddress.trim())) {
    return NextResponse.json(
      { success: false, error: { message: "Ungültige Reply-To-Adresse." } },
      { status: 400 },
    );
  }

  const row = await upsertEmailSender({
    id: body.id,
    providerConfigId: body.providerConfigId,
    internalName: body.internalName.trim(),
    displayName: body.displayName.trim(),
    emailAddress: body.emailAddress.trim().toLowerCase(),
    replyToAddress: body.replyToAddress?.trim() || undefined,
    active: body.active ?? true,
    verified: body.verified ?? false,
    defaultSender: body.defaultSender ?? false,
    allowedCategories: body.allowedCategories ?? [],
    sortOrder: body.sortOrder ?? 0,
  });

  return NextResponse.json({
    success: true,
    data: { id: row.id },
    message: body.id ? "Absender aktualisiert." : "Absender angelegt.",
  });
}
