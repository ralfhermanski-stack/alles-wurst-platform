/**
 * Mitgliedschaftspreise an Startseite anpassen.
 * Ausführung: node scripts/sync-membership-prices.cjs
 */

const path = require("node:path");
const { spawnSync } = require("node:child_process");

const runner = path.join(__dirname, "sync-membership-prices-runner.ts");

const result = spawnSync("npx", ["--yes", "tsx", runner], {
  stdio: "inherit",
  shell: true,
  cwd: path.join(__dirname, ".."),
});

process.exit(result.status ?? 1);
