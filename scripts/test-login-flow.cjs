/**
 * Diagnose: Login-Flow für Admin prüfen (lokal).
 * Usage: node scripts/test-login-flow.cjs <email> <password>
 */

const { randomBytes, scrypt } = require("node:crypto");
const { promisify } = require("node:util");
const { PrismaClient } = require("@prisma/client");

const scryptAsync = promisify(scrypt);
const prisma = new PrismaClient();

async function verifyPassword(password, storedHash) {
  const parts = storedHash.split(":");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  const salt = parts[1];
  const expectedHex = parts[2];
  const derived = await scryptAsync(password, salt, 64);
  return derived.toString("hex") === expectedHex;
}

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  const password = process.argv[3];

  if (!email || !password) {
    console.error("Usage: node scripts/test-login-flow.cjs <email> <password>");
    process.exit(1);
  }

  const user = await prisma.user.findFirst({
    where: { email, deletedAt: null },
    include: { profile: true, membership: true },
  });

  if (!user) {
    console.log("FAIL: Kein User mit dieser E-Mail.");
    process.exit(1);
  }

  console.log("User gefunden:", user.id);
  console.log("systemRole:", user.systemRole);
  console.log("passwordHash vorhanden:", Boolean(user.passwordHash));
  console.log("Profil vorhanden:", Boolean(user.profile));

  if (!user.passwordHash) {
    console.log("FAIL: Kein Passwort-Hash gespeichert.");
    process.exit(1);
  }

  const ok = await verifyPassword(password, user.passwordHash);
  console.log("Passwort-Verifikation:", ok ? "OK" : "FEHLGESCHLAGEN");

  if (!ok) {
    process.exit(1);
  }

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });
    console.log("lastLoginAt-Update: OK");
  } catch (error) {
    console.log("lastLoginAt-Update FEHLER:", error.message);
    process.exit(1);
  }

  console.log("Login-Datenbank-Check: OK");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
