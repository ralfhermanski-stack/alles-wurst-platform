/**
 * @file legal-external-fetch.ts
 * @purpose SSRF-geschützter Abruf externer Rechtstexte.
 */

import { isLegalProviderHost } from "./legal-provider-hosts";

const DEFAULT_TIMEOUT_MS = 15_000;
const MAX_BYTES = 2_000_000;

export async function fetchExternalLegalContent(
  url: string,
): Promise<{ content: string; contentType: string | null }> {
  let parsed: URL;

  try {
    parsed = new URL(url.trim());
  } catch {
    throw new Error("Die externe URL ist ungültig.");
  }

  if (parsed.protocol !== "https:") {
    throw new Error("Nur HTTPS-URLs sind für externe Rechtstexte erlaubt.");
  }

  if (!isLegalProviderHost(parsed.hostname)) {
    throw new Error("Diese Domain ist für Rechtstext-Synchronisierung nicht freigegeben.");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetch(parsed.toString(), {
      signal: controller.signal,
      headers: {
        Accept: "text/html, text/plain, application/json;q=0.9, */*;q=0.8",
        "User-Agent": "AllesWurst-LegalSync/1.0",
      },
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      throw new Error(`Externer Abruf fehlgeschlagen (${response.status}).`);
    }

    const buffer = await response.arrayBuffer();

    if (buffer.byteLength > MAX_BYTES) {
      throw new Error("Das externe Dokument ist zu groß.");
    }

    return {
      content: new TextDecoder("utf-8").decode(buffer),
      contentType: response.headers.get("content-type"),
    };
  } finally {
    clearTimeout(timeout);
  }
}
