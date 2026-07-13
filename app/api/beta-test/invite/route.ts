import { getPublicInvitePreview } from "@/lib/beta-test/beta-test-service";

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const token = url.searchParams.get("token")?.trim();

  if (!token) {
    return Response.json(
      {
        success: false,
        error: { code: "VALIDATION_ERROR", message: "Token fehlt." },
      },
      { status: 400 },
    );
  }

  const preview = await getPublicInvitePreview(token);

  if (!preview) {
    return Response.json(
      {
        success: false,
        error: { code: "NOT_FOUND", message: "Einladung nicht gefunden." },
      },
      { status: 404 },
    );
  }

  return Response.json({ success: true, data: preview });
}
