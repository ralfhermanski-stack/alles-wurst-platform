/**
 * Tests für Community-Forum-Sichtbarkeit (Datenbank).
 * Usage: node scripts/test-community-forums.cjs
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

async function visibleForumIdsForUser(user) {
  const forums = await prisma.forum.findMany({
    where: { isActive: true },
    select: { id: true, forumType: true, courseId: true, requiredMembershipRole: true },
  });

  const visible = [];

  for (const forum of forums) {
    if (user.systemRole === "ADMIN" || user.systemRole === "SUPPORT") {
      visible.push(forum.id);
      continue;
    }

    if (user.accountStatus !== "active") {
      continue;
    }

    if (forum.forumType === "course" && forum.courseId) {
      if (await hasCourseAccess(user.id, forum.courseId)) {
        visible.push(forum.id);
      }
      continue;
    }

    if (forum.forumType === "membership") {
      const membership = user.membership;
      if (
        membership?.status === "active" &&
        !membership.accessBlocked &&
        MEMBERSHIP_RANK[membership.role] >=
          MEMBERSHIP_RANK[forum.requiredMembershipRole ?? "registered"]
      ) {
        visible.push(forum.id);
      }
    }
  }

  return visible;
}

async function createTestUser(email, extra = {}) {
  return prisma.user.create({
    data: {
      email,
      passwordHash: await hashPassword("TestPass123!"),
      systemRole: extra.systemRole ?? "USER",
      profile: {
        create: {
          firstName: "Community",
          lastName: "Test",
          publicName: `comm_${Date.now()}`,
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
  console.log("Community-Foren — Tests\n");

  const communityPage = readFileSync(
    join(__dirname, "..", "app", "(marketing)", "community", "page.tsx"),
    "utf8",
  );

  assert(!communityPage.includes("Heiko W."), "Community-Seite ohne Fake Heiko W.");
  assert(!communityPage.includes("128 Themen"), "Community-Seite ohne Demo-Zahlen");
  assert(!communityPage.includes("const categories"), "Community-Seite ohne Demo-Kategorien");
  assert(
    communityPage.includes("getCommunityOverview"),
    "Community-Seite lädt echte Foren serverseitig",
  );

  const stamp = Date.now();
  const user = await createTestUser(`community-${stamp}@example.test`);

  const meisterForum = await prisma.forum.create({
    data: {
      title: `Meisterclub Test ${stamp}`,
      slug: `meisterclub-test-${stamp}`,
      forumType: "membership",
      forumPurpose: "custom",
      readAccess: "membership",
      requiredMembershipRole: "meisterclub",
      isActive: true,
    },
  });

  let visible = await visibleForumIdsForUser(user);
  assert(!visible.includes(meisterForum.id), "User ohne Mitgliedschaft: kein Meisterclub");

  const course = await prisma.course.findFirst({ where: { status: "published" } });

  if (course) {
    const courseForum = await prisma.forum.create({
      data: {
        title: `Kursforum Test ${stamp}`,
        slug: `kursforum-test-${stamp}`,
        forumType: "course",
        forumPurpose: "qa",
        readAccess: "course_access",
        courseId: course.id,
        isActive: true,
      },
    });

    visible = await visibleForumIdsForUser(user);
    assert(!visible.includes(courseForum.id), "Ohne Kurszugriff kein Kursforum");

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

    visible = await visibleForumIdsForUser(user);
    assert(visible.includes(courseForum.id), "Mit Kurszugriff sichtbares Kursforum");

    await prisma.userCourseAccess.deleteMany({
      where: { userId: user.id, courseId: course.id },
    });
    await prisma.forum.delete({ where: { id: courseForum.id } });
  }

  await prisma.membership.update({
    where: { userId: user.id },
    data: {
      role: "meisterclub",
      status: "active",
      paymentStatus: "paid",
      startedAt: new Date(),
    },
  });

  user.membership = await prisma.membership.findUnique({ where: { userId: user.id } });
  visible = await visibleForumIdsForUser(user);
  assert(visible.includes(meisterForum.id), "Meisterclub-Mitglied sieht Clubforum");

  await prisma.membership.update({
    where: { userId: user.id },
    data: { status: "cancelled", endsAt: new Date() },
  });

  user.membership = await prisma.membership.findUnique({ where: { userId: user.id } });
  visible = await visibleForumIdsForUser(user);
  assert(!visible.includes(meisterForum.id), "Beendete Mitgliedschaft entfernt Forum");

  const admin = await prisma.user.findFirst({
    where: { systemRole: "ADMIN", deletedAt: null },
    include: { membership: true },
  });

  if (admin) {
    visible = await visibleForumIdsForUser(admin);
    assert(visible.includes(meisterForum.id), "Admin sieht Meisterclub-Forum");
  }

  await prisma.forum.delete({ where: { id: meisterForum.id } });
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
