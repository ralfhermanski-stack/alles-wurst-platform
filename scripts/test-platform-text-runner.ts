/**
 * @file test-platform-text-runner.ts
 */

import { existsSync } from "node:fs";
import path from "node:path";

import {
  PLATFORM_TEXT_DEFAULTS,
  getPlatformTextDefault,
  interpolatePlatformText,
} from "../lib/platform-text/platform-text-defaults";
import { scanHardcodedTexts } from "../lib/platform-text/platform-text-scan";
import { PLATFORM_TEXT_CATEGORIES } from "../lib/platform-text/platform-text-types";

let passed = 0;
let failed = 0;

function ok(label: string) {
  passed += 1;
  console.log(`  ✓ ${label}`);
}

function fail(label: string, detail?: string) {
  failed += 1;
  console.error(`  ✗ ${label}${detail ? `: ${detail}` : ""}`);
}

console.log("Unit-Tests\n");

if (PLATFORM_TEXT_DEFAULTS.length >= 50) {
  ok(`${PLATFORM_TEXT_DEFAULTS.length} Standardtexte definiert`);
} else {
  fail("Standardtexte Anzahl");
}

if (PLATFORM_TEXT_CATEGORIES.length === 16) {
  ok("16 Kategorien");
} else {
  fail("Kategorien");
}

const footer = getPlatformTextDefault("footer.tagline");

if (footer?.category === "footer") {
  ok("Default-Lookup footer.tagline");
} else {
  fail("Default-Lookup");
}

const interpolated = interpolatePlatformText("© {year} Test", { year: 2026 });

if (interpolated === "© 2026 Test") {
  ok("Interpolation {year}");
} else {
  fail("Interpolation");
}

const report = scanHardcodedTexts(path.join(process.cwd()));

if (report.totalFindings > 0) {
  ok(`Hardcode-Scan: ${report.totalFindings} Fundstellen`);
} else {
  fail("Hardcode-Scan leer");
}

console.log("\nStruktur-Tests\n");

const files = [
  "lib/platform-text/platform-text-service.ts",
  "lib/platform-text/platform-text-defaults.ts",
  "lib/platform-text/platform-text-scan.ts",
  "app/api/admin/platform-text/route.ts",
  "app/(admin)/admin/inhalte/texte/page.tsx",
  "components/admin/platform-text/AdminPlatformTextPanel.tsx",
  "prisma/migrations/20260710103000_platform_text_management/migration.sql",
  "docs/TEXTVERWALTUNG.md",
];

for (const file of files) {
  if (existsSync(path.join(process.cwd(), file))) {
    ok(`Datei: ${file}`);
  } else {
    fail(`Datei fehlt: ${file}`);
  }
}

console.log(`\n${passed} bestanden, ${failed} fehlgeschlagen\n`);
process.exit(failed > 0 ? 1 : 0);
