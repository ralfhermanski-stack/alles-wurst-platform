#!/usr/bin/env node
/**
 * Tests: Widerruf im Konto, Vertragsunterlagen, Datenschutz-Center.
 * Ausführung: node scripts/test-account-privacy-withdrawal.cjs
 */

const { spawnSync } = require("node:child_process");
const path = require("node:path");

const runner = path.join(__dirname, "test-account-privacy-withdrawal-runner.ts");

const result = spawnSync("npx", ["--yes", "tsx", runner], {
  stdio: "inherit",
  shell: true,
  cwd: path.join(__dirname, ".."),
});

process.exit(result.status ?? 1);
