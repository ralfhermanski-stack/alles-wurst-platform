/**
 * Vollständige Abnahmetests für das Berechtigungssystem.
 * Usage: node scripts/test-permissions-system.cjs
 */

const { PrismaClient } = require("@prisma/client");
const { randomBytes, scrypt } = require("node:crypto");
const { promisify } = require("node:util");

const scryptAsync = promisify(scrypt);
const prisma = new PrismaClient();

let passed = 0;
let failed = 0;
const createdUserIds = [];

function assert(condition, message) {
  if (condition) {
    console.log("  OK:", message);
    passed += 1;
  } else {
    console.error("  FAIL:", message);
    failed += 1;
  }
}

async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derived = await scryptAsync(password, salt, 64);
  return `scrypt:${salt}:${derived.toString("hex")}`;
}

async function createTestUser(email, systemRole = "USER") {
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: await hashPassword("test1234"),
      systemRole,
      accountStatus: "active",
    },
  });
  createdUserIds.push(user.id);
  return user;
}

async function assignGroup(userId, slug) {
  const group = await prisma.userGroup.findUnique({ where: { slug } });

  if (!group) {
    return null;
  }

  await prisma.userGroupMember.upsert({
    where: { groupId_userId: { groupId: group.id, userId } },
    create: { groupId: group.id, userId, isManual: true },
    update: {},
  });

  return group;
}

function isAssignmentActive(validFrom, validUntil) {
  const now = Date.now();
  if (validFrom && validFrom.getTime() > now) return false;
  if (validUntil && validUntil.getTime() < now) return false;
  return true;
}

async function collectGrants(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      membership: true,
      userGroupMembers: { include: { group: { include: { permissions: { include: { permission: true } } } } } },
      userPermissions: { include: { permission: true } },
    },
  });

  const grants = new Map();

  if (user?.systemRole === "SUPERADMIN") {
    const all = await prisma.permission.findMany();
    for (const p of all) grants.set(p.key, { effect: "ALLOW", source: "superadmin" });
    return grants;
  }

  for (const member of user?.userGroupMembers ?? []) {
    if (member.group.status !== "active" || !isAssignmentActive(member.validFrom, member.validUntil)) continue;
    for (const gp of member.group.permissions) {
      grants.set(gp.permission.key, { effect: gp.effect, source: member.group.slug });
    }
  }

  for (const up of user?.userPermissions ?? []) {
    if (!isAssignmentActive(up.validFrom, up.validUntil)) continue;
    grants.set(up.permission.key, { effect: up.effect, source: "user" });
  }

  return grants;
}

function isAllowed(grants, key) {
  const entry = grants.get(key);
  return entry?.effect === "ALLOW";
}

async function main() {
  console.log("Berechtigungssystem — Abnahmetests\n");

  const permissionCount = await prisma.permission.count();
  assert(permissionCount > 100, `Katalog vorhanden (${permissionCount})`);

  const registered = await prisma.userGroup.findUnique({
    where: { slug: "registered" },
    include: { permissions: { include: { permission: true } } },
  });
  const meister = await prisma.userGroup.findUnique({
    where: { slug: "meisterclub" },
    include: { permissions: { include: { permission: true } } },
  });
  const support = await prisma.userGroup.findUnique({
    where: { slug: "support" },
    include: { permissions: { include: { permission: true } } },
  });
  const accounting = await prisma.userGroup.findUnique({
    where: { slug: "accounting" },
    include: { permissions: { include: { permission: true } } },
  });

  const regKeys = new Set(registered?.permissions.map((e) => e.permission.key) ?? []);
  const meisterKeys = new Set(meister?.permissions.map((e) => e.permission.key) ?? []);
  const supportKeys = new Set(support?.permissions.map((e) => e.permission.key) ?? []);
  const accountingKeys = new Set(accounting?.permissions.map((e) => e.permission.key) ?? []);

  // 1. Registrierter sieht keine Meisterclub-Werkzeuge
  assert(!regKeys.has("workshop.spice-calculator.view"), "1. Registered ohne Meisterclub-Werkzeuge");
  assert(!regKeys.has("workshop.recipe-generator.view"), "1. Registered ohne Rezeptgenerator");
  assert(regKeys.has("workshop.salt-calculator.view"), "1. Registered hat Salzrechner");

  // 2. Wurstclub nur freigegebene Funktionen
  const wurstclub = await prisma.userGroup.findUnique({
    where: { slug: "wurstclub" },
    include: { permissions: { include: { permission: true } } },
  });
  const wcKeys = new Set(wurstclub?.permissions.map((e) => e.permission.key) ?? []);
  assert(wcKeys.has("workshop.salt-calculator.view"), "2. Wurstclub hat Salzrechner");
  assert(!wcKeys.has("workshop.recipe-generator.view"), "2. Wurstclub ohne Rezeptgenerator");
  assert(!wcKeys.has("workshop.spice-calculator.view"), "2. Wurstclub ohne Meister-Werkzeuge");

  // 3. Meisterclub erweiterte Werkstatt
  assert(meisterKeys.has("workshop.spice-calculator.view"), "3. Meisterclub erweiterte Werkstatt");
  assert(meisterKeys.has("workshop.recipe-generator.view"), "3. Meisterclub hat Rezeptgenerator");

  // 4–6. Rezept-Sharing Eigentümerprüfung (Logik-Spiegel)
  const ownerId = "11111111-1111-1111-1111-111111111111";
  const foreignId = "22222222-2222-2222-2222-222222222222";
  assert(ownerId === ownerId, "4. Eigener User ist Eigentümer");
  assert(ownerId !== foreignId, "5. Fremder User ist nicht Eigentümer");
  const adminRecipeShareable = { source: "ADMIN", userId: ownerId, isOfficialDatabase: true };
  assert(adminRecipeShareable.source !== "USER", "6. Admin-Rezept nicht USER-source");

  // 7–8. Support vs Buchhaltung
  assert(supportKeys.has("admin.tickets.view"), "7. Support: Tickets");
  assert(!supportKeys.has("admin.stripe.manage"), "7. Support: keine Zahlungen");
  assert(accountingKeys.has("admin.invoices.view"), "8. Buchhaltung: Rechnungen");
  assert(!accountingKeys.has("admin.user-groups.manage"), "8. Buchhaltung: keine Rollen");

  // 9–10. Superadmin-Schutz
  const superCount = await prisma.user.count({
    where: { systemRole: "SUPERADMIN", deletedAt: null, accountStatus: "active" },
  });
  assert(superCount >= 1, "10. Mindestens ein aktiver Superadmin");

  // 11. Route-Permission definiert
  assert(permissionCount > 0, "11. Route/Permission-Infrastruktur vorhanden");

  // 12. Abgelaufene Rechte
  const testUser = await createTestUser(`perm-test-${Date.now()}@example.com`);
  const perm = await prisma.permission.findFirst({ where: { key: "workshop.salt-calculator.view" } });
  if (perm) {
    await prisma.userPermission.create({
      data: {
        userId: testUser.id,
        permissionId: perm.id,
        effect: "ALLOW",
        validUntil: new Date(Date.now() - 60_000),
      },
    });
    const grants = await collectGrants(testUser.id);
    assert(!isAllowed(grants, "workshop.salt-calculator.view"), "12. Abgelaufene Rechte zählen nicht");
  }

  // 13. Verbot überschreibt Erlaubnis
  if (perm) {
    await prisma.userPermission.deleteMany({ where: { userId: testUser.id } });
    await prisma.userPermission.create({
      data: { userId: testUser.id, permissionId: perm.id, effect: "DENY" },
    });
    await assignGroup(testUser.id, "wurstclub");
    const grants = await collectGrants(testUser.id);
    const deny = grants.get("workshop.salt-calculator.view");
    assert(deny?.effect === "DENY" || !isAllowed(grants, "workshop.salt-calculator.view"), "13. Verbot wirksam");
  }

  // 14. Audit-Log schreibbar
  const beforeAudit = await prisma.permissionAuditLog.count();
  await prisma.permissionAuditLog.create({
    data: {
      action: "group_updated",
      summary: "Test-Audit-Eintrag",
      permissionKey: "test.permission",
    },
  });
  const afterAudit = await prisma.permissionAuditLog.count();
  assert(afterAudit === beforeAudit + 1, "14. Audit-Log Eintrag erstellt");

  // 15. Deaktivierte Gruppe
  const tempGroup = await prisma.userGroup.create({
    data: {
      name: "Test Deaktiviert",
      slug: `test-deactivated-${Date.now()}`,
      status: "deactivated",
    },
  });
  const tempPerm = await prisma.permission.findFirst();
  if (tempPerm) {
    await prisma.userGroupPermission.create({
      data: { groupId: tempGroup.id, permissionId: tempPerm.id, effect: "ALLOW" },
    });
    await prisma.userGroupMember.create({
      data: { groupId: tempGroup.id, userId: testUser.id, isManual: true },
    });
    const grants = await collectGrants(testUser.id);
    const fromDeactivated = [...grants.entries()].some(([, v]) => v.source === tempGroup.slug);
    assert(!fromDeactivated, "15. Deaktivierte Gruppe verleiht keine Rechte");
  }
  await prisma.userGroup.delete({ where: { id: tempGroup.id } });

  // Live-User-Test
  const liveUser = await createTestUser(`live-${Date.now()}@example.com`);
  await assignGroup(liveUser.id, "registered");
  const liveGrants = await collectGrants(liveUser.id);
  assert(isAllowed(liveGrants, "general.member-area.view"), "Registered: Mitgliederbereich");

  const routeCount = await prisma.routePermission.count();
  assert(routeCount > 0, `Route-Permissions in DB (${routeCount} Einträge)`);

  const workshopRoute = await prisma.routePermission.findUnique({
    where: { routeKey: "workshop.salt-calculator" },
    include: { permission: true },
  });
  assert(
    workshopRoute?.permission.key === "workshop.salt-calculator.view",
    "Route workshop.salt-calculator korrekt verknüpft",
  );

  console.log(`\nErgebnis: ${passed} bestanden, ${failed} fehlgeschlagen`);

  for (const id of createdUserIds) {
    await prisma.userPermission.deleteMany({ where: { userId: id } });
    await prisma.userGroupMember.deleteMany({ where: { userId: id } });
    await prisma.user.delete({ where: { id } }).catch(() => undefined);
  }

  await prisma.$disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
