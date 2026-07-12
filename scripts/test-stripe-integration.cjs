#!/usr/bin/env node
/**
 * Tests für die Stripe-Integration.
 * Ausführung: node scripts/test-stripe-integration.cjs
 */

const { spawnSync } = require("node:child_process");
const path = require("node:path");

const runner = path.join(__dirname, "test-stripe-integration-runner.ts");

const result = spawnSync("npx", ["--yes", "tsx", runner], {
  stdio: "inherit",
  shell: true,
  cwd: path.join(__dirname, ".."),
});

process.exit(result.status ?? 1);
