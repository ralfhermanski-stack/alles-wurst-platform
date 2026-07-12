import { NextResponse } from "next/server";

import { getSessionUserIdFromRequest } from "@/lib/auth/session";
import {
  canUserShareCertificate,
  canUserShareRecipe,
} from "@/lib/sharing/share-service";

export async function GET(request: Request): Promise<Response> {
  const userId = await getSessionUserIdFromRequest(request);

  if (!userId) {
    return NextResponse.json(
      { success: false, error: { message: "Anmeldung erforderlich." } },
      { status: 401 },
    );
  }

  const url = new URL(request.url);
  const certificateId = url.searchParams.get("certificateId");
  const recipeId = url.searchParams.get("recipeId");

  if (certificateId) {
    const data = await canUserShareCertificate(certificateId, userId);
    return NextResponse.json({ success: true, data });
  }

  if (recipeId) {
    const data = await canUserShareRecipe(recipeId, userId);
    return NextResponse.json({ success: true, data });
  }

  return NextResponse.json(
    { success: false, error: { message: "certificateId oder recipeId erforderlich." } },
    { status: 400 },
  );
}
