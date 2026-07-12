/**
 * Enterprise Security System — Integrations- und Strukturtests.
 */

const { PrismaClient } = require("@prisma/client");
const fs = require("node:fs");
const path = require("node:path");

const prisma = new PrismaClient();
const root = path.join(__dirname, "..");

const requiredFiles = [
  "lib/security/security-event-service.ts",
  "lib/security/ip-block-service.ts",
  "lib/security/rate-limit-service.ts",
  "lib/security/totp-service.ts",
  "lib/security/session-registry-service.ts",
  "lib/security/security-guard.ts",
  "lib/security/upload-security.ts",
  "lib/security/security-headers.ts",
  "lib/security/resource-guard.ts",
  "components/admin/security/AdminSecurityPanel.tsx",
  "app/(admin)/admin/sicherheit/page.tsx",
  "app/api/admin/security/dashboard/route.ts",
  "prisma/migrations/20260711060000_enterprise_security/migration.sql",
];

async function main() {
  let failed = 0;

  console.log("=== Enterprise Security Tests ===\n");

  for (const file of requiredFiles) {
    const full = path.join(root, file);

    if (!fs.existsSync(full)) {
      console.log(`FAIL  Datei fehlt: ${file}`);
      failed += 1;
    } else {
      console.log(`OK    ${file}`);
    }
  }

  const settings = await prisma.securitySettings.findUnique({ where: { id: "default" } });

  if (!settings) {
    console.log("FAIL  security_settings Singleton fehlt");
    failed += 1;
  } else {
    console.log("OK    security_settings Singleton vorhanden");
  }

  const permission = await prisma.permission.findFirst({
    where: { key: "admin.security.view" },
  });

  if (!permission) {
    console.log("WARN  admin.security.view noch nicht geseedet (nach migrate/seed ausführen)");
  } else {
    console.log("OK    admin.security.view Permission vorhanden");
  }

  const nextConfig = fs.readFileSync(path.join(root, "next.config.ts"), "utf8");

  if (!nextConfig.includes("Content-Security-Policy")) {
    console.log("FAIL  Security-Header in next.config.ts fehlen");
    failed += 1;
  } else {
    console.log("OK    Security-Header in next.config.ts");
  }

  console.log(`\nErgebnis: ${failed === 0 ? "BESTANDEN" : `${failed} FEHLER`}`);

  if (failed > 0) {
    process.exit(1);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
