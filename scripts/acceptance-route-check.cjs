/**
 * Read-only HTTP status check for public and admin routes (no auth).
 * Usage: node scripts/acceptance-route-check.cjs
 */

const routes = [
  "/",
  "/akademie",
  "/akademie/kurse",
  "/rezepte",
  "/werkstatt",
  "/werkstatt/salzrechner",
  "/werkstatt/lakerechner",
  "/werkstatt/rezeptgenerator",
  "/werkstatt/rezeptdatenbank",
  "/werkstatt/marinaden-generator",
  "/werkstatt/empfehlungen",
  "/community",
  "/community/challenges",
  "/mitgliedschaft",
  "/kontakt",
  "/magazin",
  "/hilfe",
  "/hilfe/wissen",
  "/impressum",
  "/datenschutz",
  "/agb",
  "/rechtliches",
  "/widerrufsbelehrung",
  "/widerrufsformular",
  "/cookie-einstellungen",
  "/anmelden",
  "/registrieren",
  "/passwort-vergessen",
  "/wartung",
  "/mein-bereich",
  "/admin",
  "/admin/benutzer",
  "/admin/kurse",
  "/admin/support",
  "/admin/sicherheit",
  "/admin/kommunikation/email",
  "/admin/inhalte/seiteneditor",
  "/admin/marketing/social-media",
  "/admin/foren",
  "/admin/zertifikate",
  "/admin/bestellungen",
  "/admin/benutzer-rechte/gruppen",
  "/api/maintenance/status",
  "/api/courses/catalog",
  "/api/platform-text?keys=home.hero.title",
  "/api/public/reviews",
  "/this-route-should-404",
];

const BASE = process.env.ACCEPTANCE_BASE_URL || "http://localhost:3000";
const TIMEOUT_MS = 15000;

async function checkRoute(path) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(`${BASE}${path}`, {
      redirect: "manual",
      signal: controller.signal,
    });
    clearTimeout(timer);
    return { path, status: response.status, ok: response.ok || response.status < 400 };
  } catch (error) {
    clearTimeout(timer);
    return {
      path,
      status: 0,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function main() {
  console.log(`Route check base: ${BASE}\n`);
  const results = [];

  for (const path of routes) {
    const result = await checkRoute(path);
    results.push(result);
    const label = result.error ? `ERR ${result.error}` : result.status;
    console.log(`${String(label).padStart(4)}  ${path}`);
  }

  const failed = results.filter((r) => r.status === 0);
  const redirects = results.filter((r) => r.status >= 300 && r.status < 400);
  const errors = results.filter((r) => r.status >= 500);

  console.log("\n--- Summary ---");
  console.log(`Total: ${results.length}`);
  console.log(`Timeouts/errors: ${failed.length}`);
  console.log(`Redirects (expected for protected): ${redirects.length}`);
  console.log(`5xx: ${errors.length}`);

  if (failed.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
