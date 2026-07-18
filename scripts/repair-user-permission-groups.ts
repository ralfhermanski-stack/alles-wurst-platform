/**
 * Weist allen bestehenden Nutzern die passenden Rechte-Gruppen zu.
 * Beta-Nutzer (maintenanceBypass) erhalten zusätzlich die registered-Basis.
 * Einmalig nach Permission-Fixes ausführen.
 */
import { prisma } from "../lib/db/prisma";
import {
  ensureRegisteredBasisForUser,
  migrateExistingUsersToGroups,
  syncMembershipGroupForUser,
} from "../lib/permissions/permission-seed";

async function main() {
  const migration = await migrateExistingUsersToGroups();
  const users = await prisma.user.findMany({
    where: { deletedAt: null },
    select: { id: true, maintenanceBypass: true },
  });

  let betaAligned = 0;

  for (const user of users) {
    if (user.maintenanceBypass) {
      await ensureRegisteredBasisForUser(user.id);
      betaAligned += 1;
    } else {
      await syncMembershipGroupForUser(user.id);
    }
  }

  console.log(
    JSON.stringify(
      {
        migration,
        syncedUsers: users.length,
        betaAligned,
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
