/**
 * @file test-marinade-generator-runner.ts
 */

import { existsSync } from "node:fs";
import path from "node:path";

import {
  calculateMarinade,
  validateMarinadeForSave,
} from "../lib/tools/marinade-calculator";
import {
  getMarinadeAccessLevel,
  canUseMarinadeGenerator,
  canSaveMarinade,
  canReadMarinadeRecipe,
} from "../lib/tools/marinade-access";
import { buildDefaultIngredients } from "../lib/tools/marinade-presets";
import { parseMarinadePayload } from "../lib/tools/marinade-payload-validator";
import { EMPTY_MARINADE_PAYLOAD } from "../lib/tools/marinade-types";
import {
  checkMembershipCapability,
  type MembershipAccessContext,
} from "../lib/membership/membership-rules";

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

function ctx(role: MembershipAccessContext["role"]): MembershipAccessContext {
  return {
    role,
    accessBlocked: false,
    userId: role === "guest" ? null : "00000000-0000-0000-0000-000000000001",
  };
}

function runUnitTests() {
  console.log("Unit-Tests\n");

  const payload = {
    ...EMPTY_MARINADE_PAYLOAD,
    productName: "Nacken",
    totalWeightKg: 2,
    ingredients: buildDefaultIngredients({
      style: "oil",
      productType: "pork",
      intensity: "medium",
    }),
    marinationTime: "6 Stunden",
  };

  const calc = calculateMarinade(payload);

  if (calc.totalWeightKg === 2 && calc.ingredients.length > 0) {
    ok("Skalierung bei 2 kg");
  } else {
    fail("Skalierung bei 2 kg");
  }

  const scaled = calculateMarinade({ ...payload, totalWeightKg: 1 });
  const halfOil = scaled.ingredients.find((r) => r.group === "oil");

  if (halfOil && calc.ingredients.find((r) => r.group === "oil")) {
    const fullOil = calc.ingredients.find((r) => r.group === "oil")!;
    if (Math.abs(halfOil.totalAmount - fullOil.totalAmount / 2) < 0.2) {
      ok("Gewicht halbiert → Mengen halbiert");
    } else {
      fail("Gewicht halbiert → Mengen halbiert");
    }
  } else {
    fail("Öl-Zeile für Skalierungstest");
  }

  const invalid = validateMarinadeForSave({
    ...payload,
    productName: "",
    totalWeightKg: 0,
    ingredients: [],
  });

  if (!invalid.valid && invalid.errors.length >= 2) {
    ok("Validierung Pflichtfelder");
  } else {
    fail("Validierung Pflichtfelder");
  }

  const parsed = parseMarinadePayload({
    ...payload,
    recipeKind: "marinade",
  });

  if (parsed?.recipeKind === "marinade") {
    ok("Payload-Parser Marinade");
  } else {
    fail("Payload-Parser Marinade");
  }

  if (parseMarinadePayload({ recipeKind: "wurst" }) === null) {
    ok("Wurst-Payload wird abgelehnt");
  } else {
    fail("Wurst-Payload wird abgelehnt");
  }

  if (getMarinadeAccessLevel(ctx("guest")) === "none") {
    ok("Gast: kein Zugriff");
  } else {
    fail("Gast: kein Zugriff");
  }

  if (getMarinadeAccessLevel(ctx("registered")) === "demo") {
    ok("Registered: Demo");
  } else {
    fail("Registered: Demo");
  }

  if (getMarinadeAccessLevel(ctx("wurstclub")) === "full") {
    ok("Wurstclub: voll");
  } else {
    fail("Wurstclub: voll");
  }

  if (!canUseMarinadeGenerator(ctx("guest")).allowed) {
    ok("Gast blockiert");
  } else {
    fail("Gast blockiert");
  }

  if (!canSaveMarinade(ctx("registered")).allowed) {
    ok("Registered: kein Speichern");
  } else {
    fail("Registered: kein Speichern");
  }

  if (canSaveMarinade(ctx("meisterclub")).allowed) {
    ok("Meisterclub: Speichern");
  } else {
    fail("Meisterclub: Speichern");
  }

  const privateDenied = canReadMarinadeRecipe({
    recipeUserId: "00000000-0000-0000-0000-000000000099",
    visibility: "private",
    isOfficialDatabase: false,
    moderationStatus: "pending",
    requestingUserId: "00000000-0000-0000-0000-000000000001",
    isAdmin: false,
    membership: ctx("wurstclub"),
  });

  if (!privateDenied) {
    ok("Privates Rezept: Fremder blockiert");
  } else {
    fail("Privates Rezept: Fremder blockiert");
  }

  const dbAllowed = canReadMarinadeRecipe({
    recipeUserId: "00000000-0000-0000-0000-000000000099",
    visibility: "database",
    isOfficialDatabase: true,
    moderationStatus: "approved",
    requestingUserId: "00000000-0000-0000-0000-000000000001",
    isAdmin: false,
    membership: ctx("wurstclub"),
  });

  if (dbAllowed) {
    ok("Datenbankrezept: Club-Mitglied lesen");
  } else {
    fail("Datenbankrezept: Club-Mitglied lesen");
  }

  if (checkMembershipCapability(ctx("registered"), "marinade.use").allowed) {
    ok("Capability marinade.use für registered");
  } else {
    fail("Capability marinade.use für registered");
  }
}

function runStructureTests() {
  console.log("\nStruktur-Tests\n");

  const files = [
    "lib/tools/marinade-service.ts",
    "lib/tools/marinade-pdf-service.ts",
    "lib/tools/marinade-pdf-storage.ts",
    "lib/tools/marinade-client.ts",
    "app/api/tools/marinades/route.ts",
    "app/api/tools/marinades/[id]/route.ts",
    "app/api/tools/marinades/[id]/pdf/route.ts",
    "components/tools/marinade-generator/MarinadeGeneratorWizard.tsx",
    "app/(marketing)/werkstatt/marinaden-generator/page.tsx",
    "prisma/migrations/20260709193000_marinade_generator/migration.sql",
    "docs/MARINADEN_GENERATOR.md",
  ];

  for (const file of files) {
    const full = path.join(process.cwd(), file);

    if (existsSync(full)) {
      ok(`Datei vorhanden: ${file}`);
    } else {
      fail(`Datei fehlt: ${file}`);
    }
  }
}

runUnitTests();
runStructureTests();

console.log(`\n${passed} bestanden, ${failed} fehlgeschlagen\n`);
process.exit(failed > 0 ? 1 : 0);
