/**
 * Diagnose: systemRole für alle Nutzer + Login-Simulation.
 */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      email: true,
      systemRole: true,
      passwordHash: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  console.log("--- Nutzer in DB ---\n");

  for (const user of users) {
    console.log({
      email: user.email,
      systemRole: user.systemRole,
      hasPassword: Boolean(user.passwordHash),
      id: user.id,
    });
  }

  const admins = users.filter((u) => u.systemRole === "ADMIN");
  console.log(`\nAdmins: ${admins.length}`);

  if (admins.length > 0) {
    console.log("Admin-E-Mails:", admins.map((u) => u.email).join(", "));
  }

  const emailArg = process.argv[2]?.trim().toLowerCase();

  if (emailArg) {
    const match = users.find((u) => u.email === emailArg);

    if (!match) {
      console.log(`\nKein User mit E-Mail: ${emailArg}`);
    } else {
      console.log(`\nLogin-Ziel für ${emailArg}:`);
      console.log("  systemRole aus DB:", match.systemRole);
      console.log(
        "  isAdmin:",
        match.systemRole === "ADMIN",
      );
      console.log(
        "  redirect:",
        match.systemRole === "ADMIN" ? "/admin" : "/mein-bereich",
      );
    }
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
