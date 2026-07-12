/**
 * @file client-ip.ts
 * @purpose Cloudflare-kompatible Client-IP-Erkennung.
 */

/**
 * Ermittelt die echte Client-IP (Cloudflare → Proxy → direkt).
 * Reihenfolge: CF-Connecting-IP → True-Client-IP → X-Real-IP → X-Forwarded-For.
 */
export function getClientIpFromRequest(request: Request): string | null {
  const cfIp = request.headers.get("cf-connecting-ip");

  if (cfIp?.trim()) {
    return normalizeIp(cfIp.trim());
  }

  const trueClientIp = request.headers.get("true-client-ip");

  if (trueClientIp?.trim()) {
    return normalizeIp(trueClientIp.trim());
  }

  const realIp = request.headers.get("x-real-ip");

  if (realIp?.trim()) {
    return normalizeIp(realIp.trim());
  }

  const forwarded = request.headers.get("x-forwarded-for");

  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();

    if (first) {
      return normalizeIp(first);
    }
  }

  return null;
}

function normalizeIp(value: string): string {
  if (value.startsWith("::ffff:")) {
    return value.slice(7);
  }

  return value;
}

/**
 * Cloudflare-Geodaten aus Request-Headern (grobe Lokalisierung, keine GPS-Daten).
 */
export function getCloudflareGeoFromRequest(request: Request): {
  countryCode: string | null;
  region: string | null;
  asn: string | null;
  provider: string | null;
} {
  return {
    countryCode: request.headers.get("cf-ipcountry")?.trim().toUpperCase() ?? null,
    region: request.headers.get("cf-region")?.trim() ?? null,
    asn: request.headers.get("cf-asn")?.trim() ?? null,
    provider: request.headers.get("cf-asorganization")?.trim() ?? null,
  };
}
