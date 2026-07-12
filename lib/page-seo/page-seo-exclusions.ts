/**
 * @file page-seo-exclusions.ts
 * @purpose Ausschlüsse für automatische SEO-Erzeugung.
 */

const EXCLUDED_PATH_PREFIXES = [
  "/admin",
  "/api",
  "/mein-bereich",
  "/anmelden",
  "/registrieren",
  "/passwort-vergessen",
  "/passwort-zuruecksetzen",
  "/email-bestaetigen",
  "/wartung",
];

const EXCLUDED_EXACT_PATHS = new Set([
  "/kaufen/status",
  "/werkstatt/rezeptgenerator/neu",
  "/magazin/suche",
]);

const EXCLUDED_PATH_PATTERNS = [
  /^\/magazin\/[^/]+$/,
  /^\/kaufen\/status\//,
  /^\/werkstatt\/rezeptgenerator\/[^/]+$/,
  /^\/zertifikat\/verifizieren\//,
];

export function isPageSeoExcludedPath(path: string): boolean {
  const normalized = path.split("?")[0]?.replace(/\/+$/, "") || "/";

  if (EXCLUDED_EXACT_PATHS.has(normalized)) {
    return true;
  }

  for (const prefix of EXCLUDED_PATH_PREFIXES) {
    if (normalized === prefix || normalized.startsWith(`${prefix}/`)) {
      return true;
    }
  }

  if (normalized.startsWith("/magazin/")) {
    const segments = normalized.split("/").filter(Boolean);

    if (segments.length === 2 && segments[0] === "magazin") {
      return true;
    }
  }

  for (const pattern of EXCLUDED_PATH_PATTERNS) {
    if (pattern.test(normalized)) {
      return true;
    }
  }

  return false;
}

export function isBlogPostPath(path: string): boolean {
  const normalized = path.split("?")[0]?.replace(/\/+$/, "") || "/";
  const segments = normalized.split("/").filter(Boolean);

  return segments.length === 2 && segments[0] === "magazin";
}
