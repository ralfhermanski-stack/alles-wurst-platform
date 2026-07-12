#!/usr/bin/env node
/**
 * Prüft Quellcode auf versehentlich eingetragene Stripe-Secrets.
 * Ausführung: node scripts/check-stripe-secrets.cjs
 */

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");
const IGNORE_DIRS = new Set([
  "node_modules",
  ".next",
  ".git",
  "coverage",
  "dist",
  "build",
]);

const SECRET_PATTERNS = [
  /\brk_live_[A-Za-z0-9]{8,}\b/g,
  /\bsk_live_[A-Za-z0-9]{8,}\b/g,
  /\bwhsec_[A-Za-z0-9]{8,}\b/g,
];

const ALLOWED_FILES = new Set([
  path.normalize("scripts/check-stripe-secrets.cjs"),
  path.normalize("scripts/test-stripe-integration-runner.ts"),
  path.normalize("docs/STRIPE.md"),
  path.normalize(".env.example"),
]);

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORE_DIRS.has(entry.name)) {
      continue;
    }

    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      walk(fullPath, files);
      continue;
    }

    if (/\.(ts|tsx|js|jsx|json|md|env|example|cjs|mjs)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }

  return files;
}

function relative(filePath) {
  return path.relative(ROOT, filePath).replace(/\\/g, "/");
}

const violations = [];

for (const filePath of walk(ROOT)) {
  const rel = relative(filePath);

  if (ALLOWED_FILES.has(path.normalize(rel))) {
    continue;
  }

  const content = fs.readFileSync(filePath, "utf8");

  for (const pattern of SECRET_PATTERNS) {
    pattern.lastIndex = 0;
    const matches = content.match(pattern);

    if (matches) {
      violations.push({ file: rel, matches: [...new Set(matches)] });
    }
  }
}

if (violations.length > 0) {
  console.error("Stripe-Secret-Leak erkannt:\n");

  for (const violation of violations) {
    console.error(`  ${violation.file}`);
    console.error(`    ${violation.matches.join(", ")}`);
  }

  process.exit(1);
}

console.log("Keine Live-Stripe-Secrets im Quellcode gefunden.");
