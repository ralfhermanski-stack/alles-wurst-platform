/**
 * Tests für Admin-Forenverwaltung und Berechtigungsarten.
 * Usage: node scripts/test-admin-forum-management.cjs
 */

const { PrismaClient } = require("@prisma/client");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
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

const MEMBERSHIP_RANK = {
  guest: 0,
  registered: 1,
  wurstclub: 2,
  meisterclub: 3,
  accounting: 4,
  admin: 5,
};

async function hasCourseAccess(userId, courseId) {
  const access = await prisma.userCourseAccess.findUnique({
    where: { userId_courseId: { userId, courseId } },
  });

  return (
    access?.status === "active" &&
    (!access.expiresAt || access.expiresAt.getTime() > Date.now())
  );
}

async function hasAnyMiniCourseAccess(userId) {
  const access = await prisma.userCourseAccess.findFirst({
    where: {
      userId,
      status: "active",
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      course: { courseType: "minikurs" },
    },
  });

  return Boolean(access);
}

async function canReadForumMirror(user, forum) {
  if (!forum.isActive && user.systemRole !== "ADMIN" && user.systemRole !== "SUPPORT") {
    return false;
  }

  if (user.systemRole === "ADMIN" || user.systemRole === "SUPPORT") {
    return true;
  }

  if (user.accountStatus !== "active" || user.deletedAt) {
    return false;
  }

  if (forum.forumType === "general") {
    return forum.readAccess === "public" || user.accountStatus === "active";
  }

  if (forum.forumType === "course" && forum.courseId) {
    return hasCourseAccess(user.id, forum.courseId);
  }

  if (forum.forumType === "mini_course_global") {
    if (forum.courseId) {
      const course = await prisma.course.findUnique({
        where: { id: forum.courseId },
        select: { courseType: true },
      });

      if (course?.courseType !== "minikurs") {
        return false;
      }

      return hasCourseAccess(user.id, forum.courseId);
    }

    return hasAnyMiniCourseAccess(user.id);
  }

  if (forum.forumType === "membership") {
    const membership = user.membership;

    if (
      !membership ||
      membership.status !== "active" ||
      membership.accessBlocked
    ) {
      return false;
    }

    const end = membership.extendedUntil ?? membership.endsAt ?? null;

    if (end && end.getTime() < Date.now()) {
      return false;
    }

    const required = forum.requiredMembershipRole ?? "registered";

    return MEMBERSHIP_RANK[membership.role] >= MEMBERSHIP_RANK[required];
  }

  return false;
}

async function createTestUser(email, extra = {}) {
  return prisma.user.create({
    data: {
      email,
      passwordHash: await hashPassword("TestPass123!"),
      systemRole: extra.systemRole ?? "USER",
      accountStatus: extra.accountStatus ?? "active",
      profile: {
        create: {
          firstName: "Forum",
          lastName: "Admin",
          publicName: `forum_${Date.now()}`,
          street: "Weg",
          houseNumber: "1",
          postalCode: "12345",
          city: "Stadt",
          country: "DE",
        },
      },
      membership: {
        create: {
          role: extra.membershipRole ?? "registered",
          status: extra.membershipStatus ?? "none",
        },
      },
    },
    include: { membership: true },
  });
}

async function main() {
  console.log("Admin-Forenverwaltung — Tests\n");

  const managerSource = readFileSync(
    join(__dirname, "..", "components", "admin", "forums", "AdminForumManager.tsx"),
    "utf8",
  );
  const formSource = readFileSync(
    join(__dirname, "..", "components", "admin", "forums", "AdminForumForm.tsx"),
    "utf8",
  );
  const apiSource = readFileSync(
    join(__dirname, "..", "app", "api", "admin", "forums", "route.ts"),
    "utf8",
  );

  assert(managerSource.includes("Bearbeiten"), "Admin-Liste hat Bearbeiten-Button");
  assert(formSource.includes("permissionKind"), "Formular hat Berechtigungsart");
  assert(formSource.includes("writeEnabled"), "Formular hat Schreiben-Checkbox");
  assert(apiSource.includes("permissionKind"), "API akzeptiert Berechtigungsart");
  assert(
    readFileSync(
      join(__dirname, "..", "lib", "forums", "forum-permission-kinds.ts"),
      "utf8",
    ).includes("membership_wurstclub"),
    "Wurstclub-Berechtigungsart vorhanden",
  );

  const stamp = Date.now();
  const user = await createTestUser(`forum-admin-${stamp}@example.test`);

  const generalForum = await prisma.forum.create({
    data: {
      title: `Allgemein Test ${stamp}`,
      slug: `allgemein-test-${stamp}`,
      forumType: "general",
      readAccess: "registered",
      isActive: true,
    },
  });

  const wurstForum = await prisma.forum.create({
    data: {
      title: `Wurstclub Test ${stamp}`,
      slug: `wurstclub-test-${stamp}`,
      forumType: "membership",
      readAccess: "membership",
      requiredMembershipRole: "wurstclub",
      isActive: true,
    },
  });

  const meisterForum = await prisma.forum.create({
    data: {
      title: `Meisterclub Test ${stamp}`,
      slug: `meisterclub-test-${stamp}`,
      forumType: "membership",
      readAccess: "membership",
      requiredMembershipRole: "meisterclub",
      isActive: true,
    },
  });

  assert(
    await canReadForumMirror(user, generalForum),
    "Registrierter User sieht allgemeines Forum",
  );
  assert(
    !(await canReadForumMirror(user, wurstForum)),
    "User ohne Mitgliedschaft: kein Wurstclub-Forum",
  );
  assert(
    !(await canReadForumMirror(user, meisterForum)),
    "User ohne Mitgliedschaft: kein Meisterclub-Forum",
  );

  const course = await prisma.course.findFirst({
    where: { status: "published", courseType: { not: "minikurs" } },
  });

  if (course) {
    const courseForum = await prisma.forum.create({
      data: {
        title: `Kursforum Admin Test ${stamp}`,
        slug: `kursforum-admin-test-${stamp}`,
        forumType: "course",
        readAccess: "course_access",
        courseId: course.id,
        isActive: true,
      },
    });

    assert(
      !(await canReadForumMirror(user, courseForum)),
      "Ohne Kurszugriff kein Kursforum",
    );

    await prisma.userCourseAccess.create({
      data: {
        userId: user.id,
        courseId: course.id,
        status: "active",
        source: "manual",
        grantedAt: new Date(),
        adminGrantedByUserId: user.id,
      },
    });

    assert(
      await canReadForumMirror(user, courseForum),
      "Mit Kurszugriff sichtbares Kursforum",
    );

    await prisma.userCourseAccess.deleteMany({
      where: { userId: user.id, courseId: course.id },
    });
    await prisma.forum.delete({ where: { id: courseForum.id } });
  }

  const miniCourse = await prisma.course.findFirst({
    where: { courseType: "minikurs" },
  });

  if (miniCourse) {
    const miniForum = await prisma.forum.create({
      data: {
        title: `Minikursforum Test ${stamp}`,
        slug: `minikursforum-test-${stamp}`,
        forumType: "mini_course_global",
        readAccess: "mini_course_access",
        isActive: true,
      },
    });

    assert(
      !(await canReadForumMirror(user, miniForum)),
      "Ohne Minikurs kein Minikurs-Forum",
    );

    await prisma.userCourseAccess.create({
      data: {
        userId: user.id,
        courseId: miniCourse.id,
        status: "active",
        source: "manual",
        grantedAt: new Date(),
        adminGrantedByUserId: user.id,
      },
    });

    assert(
      await canReadForumMirror(user, miniForum),
      "Mit Minikurs sichtbares Minikurs-Forum",
    );

    await prisma.userCourseAccess.deleteMany({
      where: { userId: user.id, courseId: miniCourse.id },
    });
    await prisma.forum.delete({ where: { id: miniForum.id } });
  }

  await prisma.membership.update({
    where: { userId: user.id },
    data: {
      role: "wurstclub",
      status: "active",
      paymentStatus: "paid",
      startedAt: new Date(),
    },
  });

  user.membership = await prisma.membership.findUnique({ where: { userId: user.id } });

  assert(
    await canReadForumMirror(user, wurstForum),
    "Wurstclub-Mitglied sieht Wurstclub-Forum",
  );
  assert(
    !(await canReadForumMirror(user, meisterForum)),
    "Wurstclub-Mitglied sieht kein Meisterclub-Forum",
  );

  await prisma.membership.update({
    where: { userId: user.id },
    data: { role: "meisterclub" },
  });

  user.membership = await prisma.membership.findUnique({ where: { userId: user.id } });

  assert(
    await canReadForumMirror(user, meisterForum),
    "Meisterclub-Mitglied sieht Meisterclub-Forum",
  );

  await prisma.forum.update({
    where: { id: generalForum.id },
    data: { isActive: false },
  });

  const inactiveGeneralForum = await prisma.forum.findUnique({
    where: { id: generalForum.id },
  });

  assert(
    !(await canReadForumMirror(user, inactiveGeneralForum)),
    "Deaktiviertes Forum für normalen User unsichtbar",
  );

  const admin = await prisma.user.findFirst({
    where: { systemRole: "ADMIN", deletedAt: null },
    include: { membership: true },
  });

  if (admin) {
    assert(
      await canReadForumMirror(admin, generalForum),
      "Admin sieht deaktiviertes Forum",
    );
  }

  const miniForums = await prisma.forum.findMany({
    where: {
      OR: [
        { slug: "minikurse-vorstellungsforum" },
        { slug: "minikurse-fragen-und-antworten" },
        { slug: "minikurse-verbesserungen" },
      ],
    },
  });

  for (const forum of miniForums) {
    assert(
      forum.forumType === "mini_course_global",
      `Minikurs-Forum ${forum.slug} ist als mini_course_global klassifiziert`,
    );
  }

  await prisma.forum.deleteMany({
    where: {
      id: { in: [generalForum.id, wurstForum.id, meisterForum.id] },
    },
  });
  await prisma.user.delete({ where: { id: user.id } });

  console.log(`\nErgebnis: ${passed} bestanden, ${failed} fehlgeschlagen`);
  if (failed > 0) process.exit(1);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
