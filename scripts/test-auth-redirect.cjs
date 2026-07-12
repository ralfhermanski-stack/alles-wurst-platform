/**
 * Smoke-Tests für Post-Login-Redirects und Admin-Routen.
 */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

function resolvePostLoginPath(systemRole, returnTo) {
  const fallback = systemRole === "ADMIN" ? "/admin" : "/mein-bereich";

  if (!returnTo || !returnTo.startsWith("/") || returnTo.startsWith("//")) {
    return fallback;
  }

  if (systemRole === "ADMIN") {
    if (returnTo.startsWith("/admin")) {
      return returnTo;
    }

    return "/admin";
  }

  if (returnTo.startsWith("/admin")) {
    return "/mein-bereich";
  }

  return returnTo;
}

function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`${label}: erwartet ${expected}, erhalten ${actual}`);
  }

  console.log(`OK: ${label}`);
}

async function testRedirectMatrix() {
  assertEqual(
    resolvePostLoginPath("ADMIN", null),
    "/admin",
    "Admin ohne returnTo",
  );
  assertEqual(
    resolvePostLoginPath("ADMIN", "/admin/benutzer"),
    "/admin/benutzer",
    "Admin mit Admin-returnTo",
  );
  assertEqual(
    resolvePostLoginPath("ADMIN", "/mein-bereich"),
    "/admin",
    "Admin mit Member-returnTo",
  );
  assertEqual(
    resolvePostLoginPath("USER", null),
    "/mein-bereich",
    "User ohne returnTo",
  );
  assertEqual(
    resolvePostLoginPath("USER", "/mein-bereich/profil"),
    "/mein-bereich/profil",
    "User mit Member-returnTo",
  );
  assertEqual(
    resolvePostLoginPath("USER", "/admin"),
    "/mein-bereich",
    "User mit Admin-returnTo",
  );
}

async function testAdminRoutes(baseUrl) {
  const routes = [
    "/admin",
    "/admin/benutzer",
    "/admin/kurse",
    "/admin/mitgliedschaften",
    "/admin/bestellungen",
    "/admin/zertifikate",
    "/admin/einstellungen",
  ];

  for (const route of routes) {
    const response = await fetch(`${baseUrl}${route}`, { redirect: "manual" });
    const location = response.headers.get("location") ?? "";

    if (response.status !== 307 && response.status !== 302) {
      throw new Error(`${route}: erwartet Redirect, Status ${response.status}`);
    }

    if (!location.includes("/anmelden")) {
      throw new Error(`${route}: Redirect nicht zur Anmeldung (${location})`);
    }

    console.log(`OK: ${route} → Anmeldung`);
  }
}

async function main() {
  const baseUrl = process.env.TEST_BASE_URL ?? "http://localhost:3000";

  await testRedirectMatrix();
  await testAdminRoutes(baseUrl);

  const admin = await prisma.user.findFirst({
    where: { systemRole: "ADMIN", deletedAt: null },
    select: { email: true },
  });

  console.log(`Admin in DB: ${admin?.email ?? "keiner"}`);
  console.log("Hinweis: Login-Redirect im Browser mit Admin-/User-Passwort manuell prüfen.");
}

main()
  .catch((error) => {
    console.error("FEHLER:", error.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
