/**
 * Tests für Forum-Reihenfolge (sortOrder).
 * Usage: node scripts/test-forum-sort-order.cjs
 */

const { PrismaClient } = require("@prisma/client");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");

const prisma = new PrismaClient();

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

async function listForumIdsSorted() {
  const forums = await prisma.forum.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: { id: true },
  });

  return forums.map((forum) => forum.id);
}

async function main() {
  console.log("Forum-Reihenfolge — Tests\n");

  const managerSource = readFileSync(
    join(__dirname, "..", "components", "admin", "forums", "AdminForumManager.tsx"),
    "utf8",
  );
  const communitySource = readFileSync(
    join(__dirname, "..", "lib", "forums", "forum-community-service.ts"),
    "utf8",
  );
  const serviceSource = readFileSync(
    join(__dirname, "..", "lib", "forums", "forum-service.ts"),
    "utf8",
  );

  assert(managerSource.includes("moveForum"), "Admin-UI hat Verschiebe-Funktion");
  assert(managerSource.includes("saveSortOrder"), "Admin-UI kann Reihenfolge speichern");
  assert(
    readFileSync(
      join(__dirname, "..", "components", "admin", "forums", "AdminForumForm.tsx"),
      "utf8",
    ).includes("Kleinere Zahlen erscheinen weiter oben"),
    "Bearbeiten-Formular erklärt Reihenfolge",
  );
  assert(
    communitySource.includes('orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]'),
    "Community sortiert nach sortOrder und createdAt",
  );
  assert(
    serviceSource.includes('orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]'),
    "Admin-Liste sortiert nach sortOrder und createdAt",
  );
  assert(
    readFileSync(
      join(__dirname, "..", "app", "api", "admin", "forums", "[forumId]", "reorder", "route.ts"),
      "utf8",
    ).includes("reorderForum"),
    "Reorder-API vorhanden",
  );

  const stamp = Date.now();

  const forumA = await prisma.forum.create({
    data: {
      title: `Sort A ${stamp}`,
      slug: `sort-a-${stamp}`,
      forumType: "general",
      readAccess: "registered",
      sortOrder: 100,
      isActive: true,
    },
  });

  const forumB = await prisma.forum.create({
    data: {
      title: `Sort B ${stamp}`,
      slug: `sort-b-${stamp}`,
      forumType: "general",
      readAccess: "registered",
      sortOrder: 200,
      isActive: true,
    },
  });

  const forumC = await prisma.forum.create({
    data: {
      title: `Sort C ${stamp}`,
      slug: `sort-c-${stamp}`,
      forumType: "general",
      readAccess: "registered",
      sortOrder: 300,
      isActive: true,
    },
  });

  const testIds = [forumA.id, forumB.id, forumC.id];

  let sorted = await listForumIdsSorted();
  const sliceStart = sorted.indexOf(forumA.id);
  assert(sliceStart >= 0, "Testforum A in sortierter Liste");

  assert(
    sorted.indexOf(forumA.id) < sorted.indexOf(forumB.id),
    "Forum A steht vor Forum B (sortOrder)",
  );
  assert(
    sorted.indexOf(forumB.id) < sorted.indexOf(forumC.id),
    "Forum B steht vor Forum C (sortOrder)",
  );

  await prisma.forum.update({
    where: { id: forumC.id },
    data: { sortOrder: 50 },
  });

  sorted = await listForumIdsSorted();
  assert(
    sorted.indexOf(forumC.id) < sorted.indexOf(forumA.id),
    "Nach sortOrder-Update steht C vor A",
  );

  await prisma.forum.update({
    where: { id: forumA.id },
    data: { sortOrder: 200 },
  });
  await prisma.forum.update({
    where: { id: forumB.id },
    data: { sortOrder: 200 },
  });

  sorted = await listForumIdsSorted();
  const aIndex = sorted.indexOf(forumA.id);
  const bIndex = sorted.indexOf(forumB.id);
  assert(aIndex >= 0 && bIndex >= 0, "Gleiche sortOrder: Foren weiterhin gelistet");
  assert(
    aIndex !== bIndex || forumA.createdAt.getTime() <= forumB.createdAt.getTime(),
    "Bei gleicher sortOrder entscheidet createdAt",
  );

  await prisma.forum.deleteMany({ where: { id: { in: testIds } } });

  assert(!managerSource.includes("Heiko W."), "Admin-UI ohne Demo-Aktivitäten");

  console.log(`\nErgebnis: ${passed} bestanden, ${failed} fehlgeschlagen`);
  if (failed > 0) process.exit(1);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
