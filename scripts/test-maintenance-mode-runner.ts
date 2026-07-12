import {
  canBypassMaintenance,
  isMaintenanceExemptPath,
} from "../lib/maintenance/maintenance-bypass";
import {
  getMaintenanceSettings,
  subscribeMaintenanceNewsletter,
  updateMaintenanceSettings,
} from "../lib/maintenance/maintenance-service";

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

async function runUnitTests() {
  console.log("Unit-Tests\n");

  if (isMaintenanceExemptPath("/api/maintenance/status")) ok("API-Pfad ausgenommen");
  else fail("API-Pfad");

  if (isMaintenanceExemptPath("/admin/wartungsmodus")) ok("Admin-Pfad ausgenommen");
  else fail("Admin-Pfad");

  if (!isMaintenanceExemptPath("/magazin")) ok("Öffentliche Seite nicht ausgenommen");
  else fail("Öffentliche Seite");

  if (canBypassMaintenance({ userId: "1", exp: 9999999999, systemRole: "ADMIN" })) {
    ok("Admin bypass");
  } else fail("Admin bypass");

  if (
    canBypassMaintenance({
      userId: "1",
      exp: 9999999999,
      systemRole: "USER",
      maintenanceBypass: true,
    })
  ) {
    ok("maintenanceBypass bypass");
  } else fail("maintenanceBypass bypass");

  const settings = await getMaintenanceSettings();

  if (typeof settings.title === "string") ok("Settings laden");
  else fail("Settings laden");

  await updateMaintenanceSettings({
    title: settings.title,
    httpStatus: "503",
  });

  ok("Settings speichern");

  try {
    await subscribeMaintenanceNewsletter("invalid");
    fail("Newsletter-Validierung");
  } catch {
    ok("Newsletter-Validierung");
  }
}

async function runApiTests() {
  console.log("\nAPI-Tests (optional)\n");

  const base = process.env.TEST_BASE_URL ?? "http://localhost:3000";

  try {
    const statusRes = await fetch(`${base}/api/maintenance/status`);
    const statusJson = await statusRes.json();

    if (statusRes.ok && typeof statusJson.enabled === "boolean") {
      ok("GET /api/maintenance/status");
    } else {
      fail("GET /api/maintenance/status");
    }
  } catch (error) {
    console.log(
      `  ⚠ API-Tests übersprungen (${error instanceof Error ? error.message : "offline"})`,
    );
  }
}

async function main() {
  console.log("Wartungsmodus Tests\n");
  await runUnitTests();
  await runApiTests();
  console.log(`\n${passed} bestanden, ${failed} fehlgeschlagen`);
  if (failed > 0) process.exit(1);
}

void main();
