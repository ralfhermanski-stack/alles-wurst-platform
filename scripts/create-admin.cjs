/**
 * scripts/create-admin.cjs — Erstellt einen echten Admin-Nutzer in der Datenbank.
 *
 * Ausführung: npm run admin:create
 */

const { createInterface } = require("node:readline/promises");
const { stdin: input, stdout: output } = require("node:process");
const { randomBytes, scrypt } = require("node:crypto");
const { promisify } = require("node:util");
const { PrismaClient } = require("@prisma/client");

const scryptAsync = promisify(scrypt);
const prisma = new PrismaClient();

const KEY_LENGTH = 64;
const SALT_LENGTH = 16;

async function hashPassword(password) {
  const salt = randomBytes(SALT_LENGTH).toString("hex");
  const derived = await scryptAsync(password, salt, KEY_LENGTH);

  return `scrypt:${salt}:${derived.toString("hex")}`;
}

function validatePassword(password) {
  if (password.length < 8) {
    return "Das Passwort muss mindestens 8 Zeichen lang sein.";
  }

  return null;
}

async function ask(rl, question) {
  return (await rl.question(question)).trim();
}

async function main() {
  console.log("--- Alles-Wurst: Admin anlegen ---\n");

  const rl = createInterface({ input, output });

  try {
    const email = (await ask(rl, "E-Mail: ")).toLowerCase();
    const password = await ask(rl, "Passwort: ");
    const confirmPassword = await ask(rl, "Passwort bestätigen: ");
    const firstName = await ask(rl, "Vorname: ");
    const lastName = await ask(rl, "Nachname: ");

    if (!email.includes("@")) {
      throw new Error("Ungültige E-Mail-Adresse.");
    }

    const passwordError = validatePassword(password);

    if (passwordError) {
      throw new Error(passwordError);
    }

    if (password !== confirmPassword) {
      throw new Error("Passwörter stimmen nicht überein.");
    }

    if (!firstName || !lastName) {
      throw new Error("Vorname und Nachname sind erforderlich.");
    }

    const passwordHash = await hashPassword(password);
    const existing = await prisma.user.findUnique({ where: { email } });

    if (existing && existing.systemRole !== "ADMIN") {
      console.log(
        `\nHinweis: Für ${email} existiert bereits ein Nutzerkonto (Rolle: ${existing.systemRole}).`,
      );
      console.log(
        "Das Konto wird jetzt zum Administrator hochgestuft.\n",
      );
    }

    if (existing) {
      const user = await prisma.user.update({
        where: { id: existing.id },
        data: {
          passwordHash,
          systemRole: "ADMIN",
          deletedAt: null,
          emailVerifiedAt: existing.emailVerifiedAt ?? new Date(),
          profile: {
            upsert: {
              create: {
                firstName,
                lastName,
                street: "—",
                houseNumber: "—",
                postalCode: "00000",
                city: "—",
              },
              update: {
                firstName,
                lastName,
              },
            },
          },
          membership: {
            connectOrCreate: {
              where: { userId: existing.id },
              create: {
                role: "registered",
                status: "none",
                paymentStatus: "none",
              },
            },
          },
        },
      });

      console.log(`\nBestehender Nutzer wurde zum Admin hochgestuft: ${user.email}`);
      console.log("Anmeldung unter /anmelden, danach Zugriff auf /admin");
      return;
    }

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        systemRole: "ADMIN",
        emailVerifiedAt: new Date(),
        profile: {
          create: {
            firstName,
            lastName,
            street: "—",
            houseNumber: "—",
            postalCode: "00000",
            city: "—",
          },
        },
        membership: {
          create: {
            role: "registered",
            status: "none",
            paymentStatus: "none",
          },
        },
      },
    });

    console.log(`\nAdmin erfolgreich erstellt: ${user.email}`);
    console.log("Anmeldung unter /anmelden, danach Zugriff auf /admin");
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("\nFehler:", error.message ?? error);
  process.exit(1);
});
