const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

prisma.user
  .findFirst({ select: { accountStatus: true, systemRole: true, email: true } })
  .then((user) => {
    console.log("accountStatus verfügbar:", user?.accountStatus ?? "FEHLT");
    console.log("systemRole:", user?.systemRole);
    console.log("email:", user?.email);
  })
  .catch((error) => {
    console.error("FEHLER:", error.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
