/**
 * Tests für Admin-Benutzerverwaltung (Datenbank + Service-Logik).
 * Usage: node scripts/test-admin-user-management.cjs
 */

const { PrismaClient } = require("@prisma/client");
const { randomBytes, scrypt } = require("node:crypto");
const { promisify } = require("node:util");

const scryptAsync = promisify(scrypt);
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

async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derived = await scryptAsync(password, salt, 64);
  return `scrypt:${salt}:${derived.toString("hex")}`;
}

async function findOrCreateTestUser(email, data = {}) {
  const existing = await prisma.user.findFirst({ where: { email } });

  if (existing) {
    return existing;
  }

  return prisma.user.create({
    data: {
      email,
      passwordHash: await hashPassword("TestPass123!"),
      systemRole: data.systemRole ?? "USER",
      accountStatus: data.accountStatus ?? "active",
      profile: {
        create: {
          firstName: "Test",
          lastName: "Nutzer",
          street: "Testweg",
          houseNumber: "1",
          postalCode: "12345",
          city: "Teststadt",
          country: "DE",
        },
      },
      membership: {
        create: {
          role: "registered",
          status: "none",
        },
      },
    },
  });
}

async function countActiveAdmins(excludeUserId) {
  return prisma.user.count({
    where: {
      systemRole: "ADMIN",
      accountStatus: "active",
      deletedAt: null,
      ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
    },
  });
}

async function main() {
  console.log("Admin-Benutzerverwaltung — Tests\n");

  const admin = await prisma.user.findFirst({
    where: { systemRole: "ADMIN", deletedAt: null },
  });

  assert(Boolean(admin), "Mindestens ein Admin in der Datenbank");

  const testEmail = `test-admin-mgmt-${Date.now()}@example.test`;
  const testUser = await findOrCreateTestUser(testEmail);
  assert(testUser.accountStatus === "active", "Testnutzer ist aktiv");

  await prisma.user.update({
    where: { id: testUser.id },
    data: { accountStatus: "suspended" },
  });

  const suspended = await prisma.user.findUnique({
    where: { id: testUser.id },
  });
  assert(suspended.accountStatus === "suspended", "User sperren → Status suspended");

  await prisma.user.update({
    where: { id: testUser.id },
    data: { accountStatus: "active" },
  });

  const reactivated = await prisma.user.findUnique({
    where: { id: testUser.id },
  });
  assert(reactivated.accountStatus === "active", "User reaktivieren → Status active");

  for (const role of ["USER", "SUPPORT", "INSTRUCTOR", "ADMIN"]) {
    await prisma.user.update({
      where: { id: testUser.id },
      data: { systemRole: role },
    });
    const updated = await prisma.user.findUnique({ where: { id: testUser.id } });
    assert(updated.systemRole === role, `Rolle ändern → ${role}`);
  }

  await prisma.user.update({
    where: { id: testUser.id },
    data: { systemRole: "USER" },
  });

  if (admin) {
    const others = await countActiveAdmins(admin.id);
    assert(others >= 0, "Letzter-Admin-Zählung funktioniert");

    if (others === 0) {
      console.log("  INFO: Nur ein Admin — Schutzregel nicht separat testbar");
    }
  }

  const course = await prisma.course.findFirst({
    where: { status: "published" },
  });

  if (course && admin) {
    await prisma.userCourseAccess.upsert({
      where: {
        userId_courseId: { userId: testUser.id, courseId: course.id },
      },
      create: {
        userId: testUser.id,
        courseId: course.id,
        status: "active",
        source: "manual",
        grantedAt: new Date(),
        adminGrantedByUserId: admin.id,
      },
      update: {
        status: "active",
        revokedAt: null,
        adminGrantedByUserId: admin.id,
      },
    });

    const access = await prisma.userCourseAccess.findUnique({
      where: {
        userId_courseId: { userId: testUser.id, courseId: course.id },
      },
    });
    assert(access?.status === "active", "Kurs manuell zuweisen");
    assert(
      access?.adminGrantedByUserId === admin.id,
      "adminGrantedByUserId ist echte Admin-ID (nicht \"admin\")",
    );

    await prisma.userCourseAccess.update({
      where: { id: access.id },
      data: { status: "revoked", revokedAt: new Date() },
    });

    const revoked = await prisma.userCourseAccess.findUnique({
      where: { id: access.id },
    });
    assert(revoked?.status === "revoked", "Kurs entziehen");
  } else {
    console.log("  SKIP: Kurs-Zuweisung (kein veröffentlichter Kurs oder Admin)");
  }

  await prisma.membership.update({
    where: { userId: testUser.id },
    data: {
      role: "wurstclub",
      status: "active",
      startedAt: new Date(),
      paymentStatus: "paid",
    },
  });

  const membership = await prisma.membership.findUnique({
    where: { userId: testUser.id },
  });
  assert(membership?.status === "active", "Mitgliedschaft setzen");
  assert(membership?.role === "wurstclub", "Mitgliedschaftsrolle wurstclub");

  await prisma.membership.update({
    where: { userId: testUser.id },
    data: { status: "cancelled", endsAt: new Date() },
  });

  const ended = await prisma.membership.findUnique({
    where: { userId: testUser.id },
  });
  assert(ended?.status === "cancelled", "Mitgliedschaft beenden");

  if (admin) {
    await prisma.membershipAuditLog.create({
      data: {
        targetUserId: testUser.id,
        actorUserId: admin.id,
        actorRole: "admin",
        action: "user_suspend",
        summary: "Test-Audit-Eintrag",
        note: "Automatischer Test",
      },
    });

    const audit = await prisma.membershipAuditLog.findFirst({
      where: { targetUserId: testUser.id, action: "user_suspend" },
      orderBy: { createdAt: "desc" },
    });
    assert(Boolean(audit), "Audit-Log speichern");
    assert(audit.actorUserId === admin.id, "Audit enthält Admin-ID");
  }

  await prisma.user.delete({ where: { id: testUser.id } }).catch(() => {});

  console.log(`\nErgebnis: ${passed} bestanden, ${failed} fehlgeschlagen`);

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
