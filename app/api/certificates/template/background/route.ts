import { readFile } from "node:fs/promises";
import path from "node:path";

import { resolveCertificateBackgroundPath } from "@/lib/certificates/certificate-storage";
import { getCertificateBackgroundStorageKey } from "@/lib/certificates/certificate-template-service";
import { isCertificateKind } from "@/lib/certificates/certificate-types";

function guessMimeType(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase();

  if (ext === ".png") {
    return "image/png";
  }

  if (ext === ".webp") {
    return "image/webp";
  }

  if (ext === ".jpg" || ext === ".jpeg") {
    return "image/jpeg";
  }

  return "application/octet-stream";
}

/**
 * Öffentlich lesbares Hintergrundbild einer Vorlage (kein sensibler Inhalt).
 * Öffentlich, damit <img>-Tags in Admin-Vorschau und Druckansicht funktionieren.
 */
export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const kindParam = url.searchParams.get("kind");
  const kind = isCertificateKind(kindParam) ? kindParam : "certificate";

  const storageKey = await getCertificateBackgroundStorageKey(kind);

  if (!storageKey) {
    return new Response("Kein Hintergrund hochgeladen.", { status: 404 });
  }

  try {
    const absolutePath = resolveCertificateBackgroundPath(storageKey);
    const bytes = await readFile(absolutePath);

    return new Response(bytes, {
      headers: {
        "Content-Type": guessMimeType(storageKey),
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return new Response("Hintergrund nicht gefunden.", { status: 404 });
  }
}
