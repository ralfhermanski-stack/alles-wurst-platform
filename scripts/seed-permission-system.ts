/**
 * Seed-Skript für Berechtigungssystem.
 * Usage: npx tsx scripts/seed-permission-system.ts
 */

import { seedPermissionSystem } from "../lib/permissions/permission-seed";

async function main() {
  const result = await seedPermissionSystem();
  console.log("Berechtigungssystem initialisiert:", result);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
