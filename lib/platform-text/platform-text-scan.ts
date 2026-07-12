/**
 * @file platform-text-scan.ts
 * @purpose Scannt TSX-Dateien nach hardcodierten UI-Texten.
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

import { PLATFORM_TEXT_DEFAULT_MAP } from "./platform-text-defaults";

export type HardcodedTextFinding = {
  file: string;
  line: number;
  text: string;
  managed: boolean;
  suggestedKey?: string;
};

const SKIP_DIRS = new Set([
  "node_modules",
  ".next",
  ".git",
  "storage",
  "dist",
  "coverage",
]);

const SCAN_ROOTS = [
  "app",
  "components",
  "lib",
];

const TEXT_PATTERNS = [
  />\s*([^<{][^<>{}\n]{2,120}?)\s*</g,
  /title:\s*["']([^"']{3,120})["']/g,
  /description:\s*["']([^"']{10,200})["']/g,
  /placeholder=["']([^"']{3,80})["']/g,
  /aria-label=["']([^"']{3,80})["']/g,
];

function shouldSkipFile(filePath: string): boolean {
  if (!/\.(tsx|ts)$/.test(filePath)) {
    return false;
  }

  if (filePath.includes("platform-text-defaults")) {
    return true;
  }

  if (filePath.includes("platform-text-scan")) {
    return true;
  }

  return false;
}

function walkDir(dir: string, files: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);

    if (SKIP_DIRS.has(entry)) {
      continue;
    }

    const stat = statSync(full);

    if (stat.isDirectory()) {
      walkDir(full, files);
    } else if (shouldSkipFile(full)) {
      files.push(full);
    }
  }

  return files;
}

function isLikelyUiText(text: string): boolean {
  const trimmed = text.trim();

  if (trimmed.length < 3) {
    return false;
  }

  if (/^[a-z0-9_.-]+$/i.test(trimmed) && !trimmed.includes(" ")) {
    return false;
  }

  if (/^(true|false|null|undefined|className|href|http)/i.test(trimmed)) {
    return false;
  }

  if (/^\{.*\}$/.test(trimmed)) {
    return false;
  }

  return /[a-zA-ZäöüÄÖÜß]/.test(trimmed);
}

function findManagedKey(text: string): string | undefined {
  for (const [key, entry] of PLATFORM_TEXT_DEFAULT_MAP) {
    if (entry.defaultValue === text.trim()) {
      return key;
    }
  }

  return undefined;
}

export function scanHardcodedTexts(projectRoot: string): {
  generatedAt: string;
  totalFindings: number;
  managedKeys: number;
  findings: HardcodedTextFinding[];
} {
  const files: string[] = [];

  for (const root of SCAN_ROOTS) {
    const absolute = path.join(projectRoot, root);

    try {
      walkDir(absolute, files);
    } catch {
      // Verzeichnis fehlt
    }
  }

  const findings: HardcodedTextFinding[] = [];
  const seen = new Set<string>();

  for (const file of files) {
    const content = readFileSync(file, "utf8");
    const relative = path.relative(projectRoot, file).replace(/\\/g, "/");
    const lines = content.split("\n");

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex];

      for (const pattern of TEXT_PATTERNS) {
        pattern.lastIndex = 0;
        let match: RegExpExecArray | null;

        while ((match = pattern.exec(line)) !== null) {
          const text = match[1]?.trim();

          if (!text || !isLikelyUiText(text)) {
            continue;
          }

          const dedupeKey = `${relative}:${lineIndex + 1}:${text}`;

          if (seen.has(dedupeKey)) {
            continue;
          }

          seen.add(dedupeKey);

          const suggestedKey = findManagedKey(text);

          findings.push({
            file: relative,
            line: lineIndex + 1,
            text,
            managed: Boolean(suggestedKey),
            suggestedKey,
          });
        }
      }
    }
  }

  findings.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);

  return {
    generatedAt: new Date().toISOString(),
    totalFindings: findings.length,
    managedKeys: PLATFORM_TEXT_DEFAULT_MAP.size,
    findings,
  };
}
