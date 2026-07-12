const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({
    where: { email: "ralf.hermanski@alles-wurst.de", deletedAt: null },
    include: { profile: true, membership: true },
  });

  console.log("Raw user from Prisma:");
  console.log({
    id: user?.id,
    email: user?.email,
    systemRole: user?.systemRole,
    typeofSystemRole: typeof user?.systemRole,
    isAdmin: user?.systemRole === "ADMIN",
  });

  console.log("\nAll keys on user:", user ? Object.keys(user) : []);
}

main()
  .finally(() => prisma.$disconnect());
