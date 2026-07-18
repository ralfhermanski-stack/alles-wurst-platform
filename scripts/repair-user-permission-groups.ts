/**
 * Weist allen bestehenden Nutzern die passenden Rechte-Gruppen zu.
 * Einmalig nach Permission-Fixes ausführen.
 */
import { prisma } from "../lib/db/prisma";
import {
  migrateExistingUsersToGroups,
  syncMembershipGroupForUser,
} from "../lib/permissions/permission-seed";

async function main() {
  const migration = await migrateExistingUsersToGroups();
  const users = await prisma.user.findMany({
    where: { deletedAt: null },
    select: { id: true },
  });

  for (const user of users) {
    await syncMembershipGroupForUser(user.id);
  }

  console.log(
    JSON.stringify(
      {
        migration,
        syncedUsers: users.length,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
