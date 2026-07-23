/**
 * Tests für Forum-Rechte und Sichtbarkeit (Datenbank + Logik-Spiegel).
 * Usage: node scripts/test-forum-permissions.cjs
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

const MEMBERSHIP_RANK = {
  guest: 0,
  registered: 1,
  wurstclub: 2,
  meisterclub: 3,
  accounting: 4,
  admin: 5,
};

function isActiveMembership(membership) {
  if (!membership || membership.status !== "active" || membership.accessBlocked) {
    return false;
  }

  const end = membership.extendedUntil ?? membership.endsAt ?? null;

  if (end && end.getTime() < Date.now()) {
    return false;
  }

  return true;
}

async function hasCourseAccess(userId, courseId) {
  const access = await prisma.userCourseAccess.findUnique({
    where: { userId_courseId: { userId, courseId } },
  });

  if (!access || access.status !== "active") {
    return false;
  }

  if (access.expiresAt && access.expiresAt.getTime() < Date.now()) {
    return false;
  }

  return true;
}

async function canReadForumMirror(user, forum) {
  if (!forum.isActive && user.systemRole !== "ADMIN") {
    return false;
  }

  if (user.systemRole === "ADMIN" || user.systemRole === "SUPPORT") {
    return true;
  }

  if (user.accountStatus !== "active" || user.deletedAt) {
    return false;
  }

  const enrollmentGated =
    forum.forumType === "course" ||
    (forum.forumType === "mini_course_global" && Boolean(forum.courseId));

  if (
    isActiveMembership(user.membership) &&
    user.membership.role === "meisterclub" &&
    !enrollmentGated
  ) {
    return true;
  }

  if (forum.forumType === "course" && forum.courseId) {
    return hasCourseAccess(user.id, forum.courseId);
  }

  if (forum.forumType === "membership") {
    if (!isActiveMembership(user.membership)) {
      return false;
    }

    const required = forum.requiredMembershipRole ?? "registered";

    return (
      MEMBERSHIP_RANK[user.membership.role] >= MEMBERSHIP_RANK[required]
    );
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
          lastName: "Geheim",
          publicName: extra.publicName ?? `forum_${Date.now()}`,
          street: "Testweg",
          houseNumber: "1",
          postalCode: "12345",
          city: "Teststadt",
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
  console.log("Forum-Rechte — Tests\n");

  const stamp = Date.now();
  let user = await createTestUser(`forum-test-${stamp}@example.test`);

  const admin = await prisma.user.findFirst({
    where: { systemRole: "ADMIN", deletedAt: null },
    include: { membership: true },
  });

  const course = await prisma.course.findFirst({
    where: { status: "published" },
  });

  if (!course) {
    console.log("SKIP: Kein veröffentlichter Kurs.");
    process.exit(0);
  }

  let forum = await prisma.forum.findFirst({
    where: { courseId: course.id, forumType: "course", isActive: true },
  });

  if (!forum) {
    forum = await prisma.forum.create({
      data: {
        title: `${course.title} – Testforum`,
        slug: `${course.slug}-testforum-${stamp}`,
        forumType: "course",
        forumPurpose: "qa",
        readAccess: "course_access",
        courseId: course.id,
        isActive: true,
      },
    });
  }

  user = await prisma.user.findUnique({
    where: { id: user.id },
    include: { membership: true },
  });

  assert(
    !(await canReadForumMirror(user, forum)),
    "User ohne Kurszugriff sieht Kursforum nicht",
  );

  await prisma.userCourseAccess.create({
    data: {
      userId: user.id,
      courseId: course.id,
      status: "active",
      source: "manual",
      grantedAt: new Date(),
      adminGrantedByUserId: admin?.id ?? user.id,
    },
  });

  assert(
    await canReadForumMirror(user, forum),
    "User mit Kurszugriff sieht Kursforum",
  );

  await prisma.userCourseAccess.updateMany({
    where: { userId: user.id, courseId: course.id },
    data: { status: "revoked", revokedAt: new Date() },
  });

  assert(
    !(await canReadForumMirror(user, forum)),
    "Nach Kursentzug verschwindet Forum-Zugriff",
  );

  if (admin) {
    assert(await canReadForumMirror(admin, forum), "Admin sieht alles");
  }

  const clubForum = await prisma.forum.create({
    data: {
      title: `Clubforum Test ${stamp}`,
      slug: `clubforum-test-${stamp}`,
      forumType: "membership",
      forumPurpose: "custom",
      readAccess: "membership",
      requiredMembershipRole: "wurstclub",
      isActive: true,
    },
  });

  assert(
    !(await canReadForumMirror(user, clubForum)),
    "User ohne Mitgliedschaft sieht Clubforum nicht",
  );

  await prisma.membership.update({
    where: { userId: user.id },
    data: {
      role: "wurstclub",
      status: "active",
      accessBlocked: false,
      startedAt: new Date(),
      paymentStatus: "paid",
    },
  });

  user = await prisma.user.findUnique({
    where: { id: user.id },
    include: { membership: true },
  });

  assert(
    await canReadForumMirror(user, clubForum),
    "User mit Mitgliedschaft sieht Clubforum",
  );

  const meisterOnlyForum = await prisma.forum.create({
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

  assert(
    !(await canReadForumMirror(user, meisterOnlyForum)),
    "Wurstclub sieht Meisterclub-Forum nicht offen",
  );

  await prisma.membership.update({
    where: { userId: user.id },
    data: {
      role: "meisterclub",
      status: "active",
      accessBlocked: false,
      startedAt: new Date(),
      paymentStatus: "paid",
    },
  });

  user = await prisma.user.findUnique({
    where: { id: user.id },
    include: { membership: true },
  });

  assert(
    await canReadForumMirror(user, meisterOnlyForum),
    "Meisterclub öffnet Meisterclub-Forum",
  );

  assert(
    await canReadForumMirror(user, clubForum),
    "Meisterclub öffnet auch Wurstclub-Forum",
  );

  assert(
    !(await canReadForumMirror(user, forum)),
    "Meisterclub ohne Kursbuchung sieht Kursforum nicht",
  );

  await prisma.membership.update({
    where: { userId: user.id },
    data: { status: "cancelled", endsAt: new Date() },
  });

  user = await prisma.user.findUnique({
    where: { id: user.id },
    include: { membership: true },
  });

  assert(
    !(await canReadForumMirror(user, clubForum)),
    "Nach Mitgliedschafts-Ende kein Clubforum",
  );

  await prisma.user.update({
    where: { id: user.id },
    data: { accountStatus: "suspended" },
  });

  user = await prisma.user.findUnique({
    where: { id: user.id },
    include: { membership: true },
  });

  assert(
    !(await canReadForumMirror(user, clubForum)),
    "Gesperrter User hat keinen Zugriff",
  );

  const thread = await prisma.forumThread.create({
    data: {
      forumId: clubForum.id,
      authorUserId: admin?.id ?? user.id,
      title: "Test",
      slug: `test-${stamp}`,
      body: "Hallo",
      displayNameSnapshot: "Wurstfreund",
      avatarUrlSnapshot: null,
      authorRoleBadge: "Admin",
    },
  });

  assert(thread.displayNameSnapshot === "Wurstfreund", "Anzeigename im Snapshot");
  assert(!thread.displayNameSnapshot.includes("Geheim"), "Kein Klarname öffentlich");

  await prisma.forumThread.delete({ where: { id: thread.id } }).catch(() => {});
  await prisma.forum.delete({ where: { id: meisterOnlyForum.id } }).catch(() => {});
  await prisma.forum.delete({ where: { id: clubForum.id } });
  if (forum.slug.includes("-testforum-")) {
    await prisma.forum.delete({ where: { id: forum.id } }).catch(() => {});
  }
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
