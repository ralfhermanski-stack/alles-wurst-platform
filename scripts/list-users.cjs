const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: { deletedAt: null },
    select: {
      email: true,
      systemRole: true,
      passwordHash: true,
      createdAt: true,
      profile: { select: { firstName: true, lastName: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  for (const user of users) {
    console.log({
      email: user.email,
      systemRole: user.systemRole,
      hasPassword: Boolean(user.passwordHash),
      name: user.profile
        ? `${user.profile.firstName} ${user.profile.lastName}`
        : null,
    });
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
