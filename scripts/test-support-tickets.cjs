/**
 * Tests für Support-Ticketsystem.
 * Usage: node scripts/test-support-tickets.cjs
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

async function main() {
  console.log("Support-Tickets — Tests\n");

  const schema = readFileSync(
    join(__dirname, "..", "prisma", "schema.prisma"),
    "utf8",
  );

  assert(schema.includes("model SupportTicket"), "SupportTicket-Modell vorhanden");
  assert(schema.includes("model SupportTicketMessage"), "Nachrichtenmodell vorhanden");
  assert(schema.includes("model SupportTicketEvent"), "Event-Log vorhanden");

  assert(
    readFileSync(
      join(__dirname, "..", "app", "(member)", "mein-bereich", "support", "page.tsx"),
      "utf8",
    ).includes("UserSupportPanel"),
    "User-Support-Seite vorhanden",
  );

  assert(
    readFileSync(
      join(__dirname, "..", "app", "(admin)", "admin", "support", "page.tsx"),
      "utf8",
    ).includes("AdminSupportDashboard"),
    "Admin-Support-Seite vorhanden",
  );

  const categories = await prisma.supportTicketCategory.findMany();

  if (categories.length === 0) {
    const defaults = [
      { name: "Kurse", slug: "kurse", sortOrder: 10 },
      { name: "Allgemeine Anfrage", slug: "allgemein", sortOrder: 70 },
    ];

    for (const entry of defaults) {
      await prisma.supportTicketCategory.create({ data: entry });
    }
  }

  const seededCategories = await prisma.supportTicketCategory.findMany();
  assert(seededCategories.length >= 1, "Support-Kategorien in DB");

  const stamp = Date.now();
  const user = await prisma.user.create({
    data: {
      email: `support-user-${stamp}@example.test`,
      passwordHash: await hashPassword("TestPass123!"),
      profile: {
        create: {
          firstName: "Support",
          lastName: "User",
          publicName: `support_user_${stamp}`,
          street: "Weg",
          houseNumber: "1",
          postalCode: "12345",
          city: "Stadt",
          country: "DE",
        },
      },
      membership: { create: { role: "registered", status: "none" } },
    },
  });

  const otherUser = await prisma.user.create({
    data: {
      email: `support-other-${stamp}@example.test`,
      passwordHash: await hashPassword("TestPass123!"),
      profile: {
        create: {
          firstName: "Other",
          lastName: "User",
          publicName: `support_other_${stamp}`,
          street: "Weg",
          houseNumber: "2",
          postalCode: "12345",
          city: "Stadt",
          country: "DE",
        },
      },
      membership: { create: { role: "registered", status: "none" } },
    },
  });

  const category = seededCategories[0];

  const ticket = await prisma.supportTicket.create({
    data: {
      ticketNumber: `AW-T-2026-${String(stamp).slice(-6)}`,
      userId: user.id,
      categoryId: category.id,
      subject: `Testticket ${stamp}`,
      status: "open",
      priority: "normal",
      messages: {
        create: {
          authorUserId: user.id,
          authorType: "user",
          body: "Hilfe bitte",
          isReadByUser: true,
        },
      },
    },
  });

  assert(ticket.ticketNumber.startsWith("AW-T-"), "Ticketnummer im AW-T-Format");

  const ownTickets = await prisma.supportTicket.findMany({
    where: { userId: user.id },
  });
  assert(ownTickets.length >= 1, "User sieht eigene Tickets");

  const foreign = await prisma.supportTicket.findFirst({
    where: { id: ticket.id, userId: otherUser.id },
  });
  assert(!foreign, "Fremder User sieht Ticket nicht");

  await prisma.supportTicketMessage.create({
    data: {
      ticketId: ticket.id,
      authorUserId: user.id,
      authorType: "staff",
      body: "Wir kümmern uns darum",
      isReadByUser: false,
    },
  });

  await prisma.supportTicket.update({
    where: { id: ticket.id },
    data: { userUnreadCount: 1 },
  });

  const unreadTicket = await prisma.supportTicket.findUnique({
    where: { id: ticket.id },
  });
  assert(unreadTicket.userUnreadCount === 1, "Ungelesene Staff-Antwort im Posteingang");

  await prisma.supportTicketEvent.create({
    data: {
      ticketId: ticket.id,
      eventType: "assigned",
      summary: "Ticket zugewiesen",
    },
  });

  const events = await prisma.supportTicketEvent.count({
    where: { ticketId: ticket.id },
  });
  assert(events >= 1, "Audit-Events gespeichert");

  await prisma.supportTicket.delete({ where: { id: ticket.id } });
  await prisma.user.delete({ where: { id: user.id } });
  await prisma.user.delete({ where: { id: otherUser.id } });

  console.log(`\nErgebnis: ${passed} bestanden, ${failed} fehlgeschlagen`);
  if (failed > 0) process.exit(1);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
