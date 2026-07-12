import { NextResponse } from "next/server";

import { getSessionUserIdFromRequest } from "@/lib/auth/session";
import {
  createOrGetCertificateShare,
  createOrUpdateRecipeShare,
  getUserTopShares,
  listUserShares,
  revokeUserShare,
  updateUserShare,
} from "@/lib/sharing/share-service";
import { getClientIp } from "@/lib/sharing/share-security";

import type { ShareStatus } from "@prisma/client";

export async function GET(request: Request): Promise<Response> {
  const userId = await getSessionUserIdFromRequest(request);

  if (!userId) {
    return NextResponse.json(
      { success: false, error: { message: "Anmeldung erforderlich." } },
      { status: 401 },
    );
  }

  const url = new URL(request.url);
  const top = url.searchParams.get("top");

  const data = top === "1" ? await getUserTopShares(userId) : await listUserShares(userId);
  return NextResponse.json({ success: true, data });
}

export async function POST(request: Request): Promise<Response> {
  const userId = await getSessionUserIdFromRequest(request);

  if (!userId) {
    return NextResponse.json(
      { success: false, error: { message: "Anmeldung erforderlich." } },
      { status: 401 },
    );
  }

  const body = (await request.json()) as {
    action?: "certificate" | "recipe" | "update" | "revoke";
    certificateId?: string;
    recipeId?: string;
    shareId?: string;
    consent?: boolean;
    isPublic?: boolean;
    linkOnly?: boolean;
    showIngredients?: boolean;
    showInstructions?: boolean;
    status?: ShareStatus;
  };

  const ipAddress = getClientIp(request);

  try {
    if (body.action === "certificate") {
      if (!body.certificateId) {
        return NextResponse.json(
          { success: false, error: { message: "Zertifikat-ID fehlt." } },
          { status: 400 },
        );
      }

      const data = await createOrGetCertificateShare({
        certificateId: body.certificateId,
        ownerUserId: userId,
        consent: body.consent === true,
        ipAddress,
      });

      return NextResponse.json({ success: true, data });
    }

    if (body.action === "recipe") {
      if (!body.recipeId) {
        return NextResponse.json(
          { success: false, error: { message: "Rezept-ID fehlt." } },
          { status: 400 },
        );
      }

      const data = await createOrUpdateRecipeShare({
        recipeId: body.recipeId,
        ownerUserId: userId,
        isPublic: body.isPublic ?? false,
        linkOnly: body.linkOnly ?? false,
        showIngredients: body.showIngredients ?? false,
        showInstructions: body.showInstructions ?? false,
        ipAddress,
      });

      return NextResponse.json({ success: true, data });
    }

    if (body.action === "update") {
      if (!body.shareId) {
        return NextResponse.json(
          { success: false, error: { message: "Freigabe-ID fehlt." } },
          { status: 400 },
        );
      }

      const data = await updateUserShare({
        shareId: body.shareId,
        ownerUserId: userId,
        status: body.status,
        isPublic: body.isPublic,
        linkOnly: body.linkOnly,
        showIngredients: body.showIngredients,
        showInstructions: body.showInstructions,
        ipAddress,
      });

      return NextResponse.json({ success: true, data });
    }

    if (body.action === "revoke") {
      if (!body.shareId) {
        return NextResponse.json(
          { success: false, error: { message: "Freigabe-ID fehlt." } },
          { status: 400 },
        );
      }

      await revokeUserShare(body.shareId, userId, ipAddress);
      return NextResponse.json({ success: true, message: "Freigabe gelöscht." });
    }

    return NextResponse.json(
      { success: false, error: { message: "Unbekannte Aktion." } },
      { status: 400 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Aktion fehlgeschlagen.";
    const status = message.includes("verweigert") ? 403 : 400;
    return NextResponse.json({ success: false, error: { message } }, { status });
  }
}
