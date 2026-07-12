/**
 * Analytics Tests
 * Ausführung: node scripts/test-analytics.cjs
 */

const path = require("node:path");
const { spawnSync } = require("node:child_process");

const runner = path.join(__dirname, "test-analytics-runner.ts");

const result = spawnSync("npx", ["tsx", runner], {
  stdio: "inherit",
  shell: true,
  cwd: path.join(__dirname, ".."),
  env: { ...process.env, NODE_ENV: "development" },
});

process.exit(result.status ?? 1);
