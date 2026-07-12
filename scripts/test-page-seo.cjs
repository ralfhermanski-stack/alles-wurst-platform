/**
 * Page-SEO Tests
 * Ausführung: node scripts/test-page-seo.cjs
 */

const path = require("node:path");
const { spawnSync } = require("node:child_process");

const runner = path.join(__dirname, "test-page-seo-runner.ts");

const result = spawnSync("npx", ["tsx", runner], {
  stdio: "inherit",
  shell: true,
  cwd: path.join(__dirname, ".."),
});

process.exit(result.status ?? 1);
