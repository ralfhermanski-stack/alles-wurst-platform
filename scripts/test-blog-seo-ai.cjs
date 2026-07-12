#!/usr/bin/env node
/**
 * Testskript für Blog-SEO/KI (Service, Meta, API).
 * Ausführung: node scripts/test-blog-seo-ai.cjs
 */

const { spawnSync } = require("node:child_process");
const path = require("node:path");

const runner = path.join(__dirname, "test-blog-seo-ai-runner.ts");

const result = spawnSync("npx", ["--yes", "tsx", runner], {
  stdio: "inherit",
  shell: true,
  cwd: path.join(__dirname, ".."),
  env: {
    ...process.env,
    OPENAI_API_KEY: "",
  },
});

process.exit(result.status ?? 1);
