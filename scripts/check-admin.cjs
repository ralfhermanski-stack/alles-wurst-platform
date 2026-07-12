const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const admins = await prisma.user.count({
    where: {
      deletedAt: null,
      systemRole: { in: ["ADMIN", "SUPERADMIN"] },
    },
  });

  const withPassword = await prisma.user.count({
    where: { passwordHash: { not: null }, deletedAt: null },
  });

  const admin = await prisma.user.findFirst({
    where: {
      deletedAt: null,
      systemRole: { in: ["ADMIN", "SUPERADMIN"] },
    },
    select: {
      email: true,
      systemRole: true,
      passwordHash: true,
      profile: { select: { id: true } },
    },
  });

  console.log("admins:", admins);
  console.log("usersWithPassword:", withPassword);
  console.log("adminEmail:", admin?.email ?? "none");
  console.log("hasPasswordHash:", Boolean(admin?.passwordHash));
  console.log("hasProfile:", Boolean(admin?.profile));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
