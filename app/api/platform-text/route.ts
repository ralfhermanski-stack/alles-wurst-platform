/**
 * @file app/api/platform-text/route.ts
 * @purpose Öffentlicher Lese-Endpunkt für Frontend-Texte (keine Auth nötig).
 */

import { getPlatformTexts } from "@/lib/platform-text/platform-text-service";

export async function GET(request: Request): Promise<Response> {
  const params = new URL(request.url).searchParams;
  const keysParam = params.get("keys");

  if (!keysParam) {
    return Response.json(
      {
        success: false,
        error: { code: "VALIDATION_ERROR", message: "Parameter keys ist erforderlich." },
      },
      { status: 400 },
    );
  }

  const keys = keysParam
    .split(",")
    .map((key) => key.trim())
    .filter(Boolean)
    .slice(0, 100);

  const texts = await getPlatformTexts(keys);

  return Response.json(
    { success: true, data: texts },
    {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
      },
    },
  );
}
