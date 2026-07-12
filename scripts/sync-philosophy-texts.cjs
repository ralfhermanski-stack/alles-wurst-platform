/**
 * Philosophie-Texte aus der Registry in die DB synchronisieren.
 * Ausführung: node scripts/sync-philosophy-texts.cjs
 */

const path = require("node:path");
const { spawnSync } = require("node:child_process");

const runner = path.join(__dirname, "sync-philosophy-texts-runner.ts");

const result = spawnSync("npx", ["--yes", "tsx", runner], {
  stdio: "inherit",
  shell: true,
  cwd: path.join(__dirname, ".."),
});

process.exit(result.status ?? 1);
