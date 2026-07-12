/**
 * scripts/test-db-connection.cjs — Technischer Datenbank-Verbindungstest
 *
 * Zweck:
 *   Prüft, ob PostgreSQL erreichbar ist und Prisma lesen/schreiben kann.
 *   Legt einen Eintrag in der Tabelle `connection_test` an und gibt ihn aus.
 *
 * Ausführung:
 *   npm run db:test
 *
 * Voraussetzungen:
 *   1. Docker-Container läuft:  npm run db:up
 *   2. Migration ausgeführt:      npm run db:migrate
 *   3. Client generiert:          npm run db:generate
 *
 * Hinweis:
 *   CommonJS (.cjs), damit kein zusätzliches TypeScript-Runner-Paket nötig ist.
 *   Keine Fachlogik — nur Infrastruktur-Check.
 */

const { PrismaClient } = require("@prisma/client");

/** Prisma-Client für diesen einmaligen Test (kein Singleton nötig) */
const prisma = new PrismaClient();

async function main() {
  console.log("--- Alles-Wurst 2.0: Datenbank-Verbindungstest ---");
  console.log("Verbinde mit PostgreSQL …");

  // $connect() stellt explizit die Verbindung her (hilfreich bei Fehlerdiagnose)
  await prisma.$connect();
  console.log("Verbindung hergestellt.");

  // Einen Testeintrag schreiben — bestätigt Lese- und Schreibzugriff
  const row = await prisma.connectionTest.create({
    data: {
      message: "connection-ok",
    },
  });

  console.log("Testeintrag geschrieben:");
  console.log(`  id:        ${row.id}`);
  console.log(`  message:   ${row.message}`);
  console.log(`  checkedAt: ${row.checkedAt.toISOString()}`);
  console.log("--- Verbindungstest erfolgreich ---");
}

main()
  .catch((error) => {
    console.error("--- Verbindungstest fehlgeschlagen ---");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    // Verbindung sauber schließen — wichtig bei Skripten
    await prisma.$disconnect();
  });
