import { readMaintenanceImageBytes } from "@/lib/maintenance/maintenance-image-storage";
import type { MaintenanceImageKind } from "@/lib/maintenance/maintenance-image-storage";
import { getMaintenanceImageMeta } from "@/lib/maintenance/maintenance-service";

type RouteContext = { params: Promise<{ kind: string }> };

function parseKind(value: string): MaintenanceImageKind | null {
  if (value === "logo" || value === "background") {
    return value;
  }

  return null;
}

export async function GET(
  _request: Request,
  context: RouteContext,
): Promise<Response> {
  const { kind: kindParam } = await context.params;
  const kind = parseKind(kindParam);

  if (!kind) {
    return new Response("Nicht gefunden", { status: 404 });
  }

  const meta = await getMaintenanceImageMeta(kind);

  if (!meta) {
    return new Response("Nicht gefunden", { status: 404 });
  }

  try {
    const bytes = await readMaintenanceImageBytes(meta.storageKey);

    return new Response(Buffer.from(bytes), {
      headers: {
        "Content-Type": meta.mimeType,
        "Cache-Control": "public, max-age=86400, immutable",
      },
    });
  } catch {
    return new Response("Bild nicht gefunden", { status: 404 });
  }
}
