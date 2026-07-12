#!/usr/bin/env node
/**
 * Tests für Rechtstexte, Widerruf und Checkout-Zustimmungen.
 * Ausführung: node scripts/test-legal-system.cjs
 */

const { spawnSync } = require("node:child_process");
const path = require("node:path");

const runner = path.join(__dirname, "test-legal-system-runner.ts");

const result = spawnSync("npx", ["--yes", "tsx", runner], {
  stdio: "inherit",
  shell: true,
  cwd: path.join(__dirname, ".."),
});

process.exit(result.status ?? 1);
