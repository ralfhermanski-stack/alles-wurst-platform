/**
 * Tests für Hilfe-Center / Wissensdatenbank.
 * Usage: node scripts/test-help-center.cjs
 */

const { PrismaClient } = require("@prisma/client");
const { readFileSync, existsSync } = require("node:fs");
const { join } = require("node:path");

const prisma = new PrismaClient();
const root = join(__dirname, "..");

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log("  OK:", message);
    passed += 1;
  } else {
    console.error("  FAIL:", message);
    failed += 1;
  }
}

function read(relPath) {
  return readFileSync(join(root, relPath), "utf8");
}

function exists(relPath) {
  return existsSync(join(root, relPath));
}

async function main() {
  console.log("Hilfe-Center — Tests\n");

  const schema = read("prisma/schema.prisma");

  assert(schema.includes("model KnowledgeBaseCategory"), "KnowledgeBaseCategory-Modell");
  assert(schema.includes("model KnowledgeBaseArticle"), "KnowledgeBaseArticle-Modell");
  assert(schema.includes("model KnowledgeBaseSearchLog"), "KnowledgeBaseSearchLog-Modell");
  assert(schema.includes("isMasterSupport"), "Meister-Support-Kennzeichnung am Schema");

  const routes = [
    ["app/(marketing)/hilfe/page.tsx", "/hilfe"],
    ["app/(marketing)/hilfe/wissen/page.tsx", "/hilfe/wissen"],
    ["app/(marketing)/hilfe/meister-support/page.tsx", "/hilfe/meister-support"],
    ["app/(member)/account/tickets/page.tsx", "/account/tickets"],
    ["app/(member)/account/tickets/new/page.tsx", "/account/tickets/new"],
    ["app/(admin)/admin/support/wissensdatenbank/page.tsx", "Admin Wissensdatenbank"],
  ];

  for (const [file, label] of routes) {
    assert(exists(file), `Route/Seite vorhanden: ${label}`);
  }

  assert(read("components/help/HelpHubCards.tsx").includes("/hilfe"), "HelpHubCards verlinkt Hilfe-Hub");
  assert(read("components/help/KnowledgeBaseBrowser.tsx").includes("fromFaq"), "KB-Browser setzt FAQ-Ticket-Tracking");
  assert(read("lib/help/help-hub-config.ts").includes("meister-support"), "Meister-Support-Slug konfiguriert");

  const nav = read("lib/admin/admin-nav.ts");
  assert(nav.includes("Wissensdatenbank"), "Admin-Navigation: Wissensdatenbank");
  assert(nav.includes("Meister-Support"), "Admin-Navigation: Meister-Support");

  const defaults = read("lib/platform-text/platform-text-defaults.ts");
  assert(defaults.includes('"help.title"'), "Textschlüssel help.title");
  assert(defaults.includes('"help.search.placeholder"'), "Textschlüssel help.search.placeholder");
  assert(defaults.includes('"help.masterSupportLocked"'), "Textschlüssel help.masterSupportLocked");

  try {
    const categories = await prisma.knowledgeBaseCategory.findMany();
    assert(Array.isArray(categories), "KB-Kategorien abfragbar");
  } catch (error) {
    assert(false, `KB-Tabellen in DB: ${error.message}`);
  }

  try {
    await prisma.supportTicketCategory.upsert({
      where: { slug: "meister-support" },
      create: {
        name: "Meister-Support",
        slug: "meister-support",
        description: "Exklusiver Support für Meisterclub-Mitglieder",
        sortOrder: 5,
        isMasterSupport: true,
      },
      update: {
        isMasterSupport: true,
        isActive: true,
      },
    });

    const masterCategory = await prisma.supportTicketCategory.findFirst({
      where: { slug: "meister-support" },
    });
    assert(
      masterCategory?.isMasterSupport === true,
      "Meister-Support-Kategorie in DB (slug meister-support)",
    );
  } catch (error) {
    assert(false, `Support-Kategorien: ${error.message}`);
  }

  console.log(`\nErgebnis: ${passed} bestanden, ${failed} fehlgeschlagen`);
  await prisma.$disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
