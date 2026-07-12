/**
 * @file scripts/test-page-editor-runner.ts
 */

import assert from "node:assert/strict";
import { createHmac } from "node:crypto";

import { canManagePageContent } from "../lib/page-editor/page-editor-auth";
import { checkPageEditorWriteRateLimit } from "../lib/page-editor/page-editor-rate-limit";
import {
  sanitizePlainPlatformText,
  sanitizeRichPlatformText,
} from "../lib/page-editor/page-editor-sanitize";
import {
  createPageEditorPreviewToken,
  verifyPageEditorPreviewToken,
} from "../lib/page-editor/preview-token-edge";
import { getEditablePageById } from "../lib/page-editor/page-registry";

function getDevSecret(): string {
  return "dev-auth-session-secret-fallback-change-me-please-32plus";
}

function signPreviewToken(payload: Record<string, unknown>): string {
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = createHmac("sha256", getDevSecret()).update(body).digest("base64url");
  return `${body}.${signature}`;
}

let passed = 0;

async function test(name: string, fn: () => void | Promise<void>): Promise<void> {
  await fn();
  passed += 1;
  console.log(`✓ ${name}`);
}

if (!process.env.AUTH_SESSION_SECRET) {
  process.env.AUTH_SESSION_SECRET = getDevSecret();
}

async function run(): Promise<void> {
  await test("Preview-Token signieren und verifizieren", async () => {
    const payload = {
      sessionId: "session-abc",
      userId: "user-xyz",
      pageId: "home",
      expiresAt: Date.now() + 60_000,
    };

    const token = await createPageEditorPreviewToken(payload);
    const verified = await verifyPageEditorPreviewToken(token);

    assert.equal(verified?.pageId, "home");
    assert.equal(verified?.userId, payload.userId);
  });

  await test("Abgelaufener Preview-Token wird abgewiesen", async () => {
    const token = signPreviewToken({
      sessionId: "s1",
      userId: "u1",
      pageId: "home",
      expiresAt: Date.now() - 1000,
    });

    assert.equal(await verifyPageEditorPreviewToken(token), null);
  });

  await test("Manipulierter Preview-Token wird abgewiesen", async () => {
    const token = signPreviewToken({
      sessionId: "s1",
      userId: "u1",
      pageId: "home",
      expiresAt: Date.now() + 60_000,
    });

    assert.equal(await verifyPageEditorPreviewToken(`${token}x`), null);
  });

  await test("XSS in Plaintext wird entfernt", () => {
    const input = '<script>alert(1)</script>Hallo';
    const output = sanitizePlainPlatformText(input);
    assert.equal(output, "Hallo");
  });

  await test("JavaScript-URLs werden aus Rich-Text entfernt", () => {
    const input = '<a href="javascript:alert(1)">Link</a>';
    const output = sanitizeRichPlatformText(input);
    assert.ok(!output.includes("javascript:"));
  });

  await test("Nur ADMIN mit content.manage darf Inhalte verwalten", () => {
    assert.equal(canManagePageContent("ADMIN"), true);
    assert.equal(canManagePageContent("USER"), false);
    assert.equal(canManagePageContent("SUPPORT"), false);
  });

  await test("Seiten-Registry enthält Startseite", () => {
    const home = getEditablePageById("home");
    assert.ok(home);
    assert.equal(home.path, "/");
    assert.ok(home.textKeys.length >= 5);
  });

  await test("Rate-Limit blockiert nach Schwellwert", () => {
    const userId = `test-user-${Date.now()}`;

    for (let index = 0; index < 60; index++) {
      const result = checkPageEditorWriteRateLimit(userId);
      assert.equal(result.allowed, true);
    }

    const blocked = checkPageEditorWriteRateLimit(userId);
    assert.equal(blocked.allowed, false);
  });

  console.log(`\n${passed} Tests bestanden.`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
