/**
 * @file legal-provider-hosts.ts
 * @purpose Freigegebene Domains für Rechtstext-Sync und Iframe-Einbindung.
 */

const DEFAULT_LEGAL_PROVIDER_HOSTS = [
  "www.e-recht24.de",
  "e-recht24.de",
  "www.it-recht-kanzlei.de",
  "it-recht-kanzlei.de",
  "itrk.legal",
  "www.itrk.legal",
  "www.activemind.de",
  "activemind.de",
];

export function getLegalProviderHosts(): string[] {
  const env = process.env.LEGAL_SYNC_ALLOWED_HOSTS?.trim();

  if (!env) {
    return DEFAULT_LEGAL_PROVIDER_HOSTS;
  }

  return env.split(",").map((entry) => entry.trim().toLowerCase()).filter(Boolean);
}

export function isLegalProviderHost(hostname: string): boolean {
  const host = hostname.toLowerCase();

  return getLegalProviderHosts().some(
    (allowed) => host === allowed || host.endsWith(`.${allowed}`),
  );
}

export function resolveLegalProviderHttpsUrl(
  url: string | null | undefined,
): string | null {
  const trimmed = url?.trim();

  if (!trimmed) {
    return null;
  }

  let parsed: URL;

  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }

  if (parsed.protocol !== "https:") {
    return null;
  }

  if (!isLegalProviderHost(parsed.hostname)) {
    return null;
  }

  return parsed.toString();
}

export function legalProviderFrameSrcCsp(): string {
  const hosts = new Set<string>();

  for (const host of getLegalProviderHosts()) {
    hosts.add(`https://${host}`);
  }

  return [...hosts].join(" ");
}
