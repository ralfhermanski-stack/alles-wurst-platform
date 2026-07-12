/**
 * Bestehenden Nutzer zum Admin oder Superadmin machen (optional neues Passwort setzen).
 *
 * Usage:
 *   node scripts/promote-admin.cjs <email>
 *   node scripts/promote-admin.cjs <email> <neues-passwort>
 *   node scripts/promote-admin.cjs --superadmin <email>
 *   node scripts/promote-admin.cjs --superadmin <email> <neues-passwort>
 */

const { randomBytes, scrypt } = require("node:crypto");
const { promisify } = require("node:util");
const { PrismaClient } = require("@prisma/client");

const scryptAsync = promisify(scrypt);
const prisma = new PrismaClient();

async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derived = await scryptAsync(password, salt, 64);
  return `scrypt:${salt}:${derived.toString("hex")}`;
}

async function main() {
  const superadminFlag = process.argv[2] === "--superadmin";
  const email = (superadminFlag ? process.argv[3] : process.argv[2])
    ?.trim()
    .toLowerCase();
  const newPassword = superadminFlag ? process.argv[4] : process.argv[3];
  const targetRole = superadminFlag ? "SUPERADMIN" : "ADMIN";

  if (!email) {
    console.error(
      "Usage: node scripts/promote-admin.cjs [--superadmin] <email> [neues-passwort]",
    );
    process.exit(1);
  }

  const user = await prisma.user.findFirst({
    where: { email, deletedAt: null },
  });

  if (!user) {
    console.error(`Kein Nutzer mit E-Mail ${email} gefunden.`);
    process.exit(1);
  }

  const data = {
    systemRole: targetRole,
    emailVerifiedAt: user.emailVerifiedAt ?? new Date(),
  };

  if (newPassword) {
    if (newPassword.length < 8) {
      console.error("Passwort muss mindestens 8 Zeichen haben.");
      process.exit(1);
    }

    data.passwordHash = await hashPassword(newPassword);
  }

  await prisma.user.update({
    where: { id: user.id },
    data,
  });

  console.log(`${targetRole}-Rolle gesetzt für: ${email}`);
  if (newPassword) {
    console.log("Neues Passwort wurde gespeichert.");
  } else {
    console.log("Passwort unverändert — bitte bestehendes Login-Passwort verwenden.");
  }
}

main()
  .catch((error) => {
    console.error(error.message ?? error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
