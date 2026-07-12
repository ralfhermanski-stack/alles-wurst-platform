/**
 * Automatisierte Tests: Zentrales E-Mail-System
 */

import "dotenv/config";

import assert from "node:assert/strict";

import { prisma } from "../lib/db/prisma";
import { ensureEmailSystemDefaults } from "../lib/email/email-bootstrap";
import {
  hashRecipientEmail,
  isEmailSuppressed,
  maskRecipientEmail,
  suppressEmailAddress,
} from "../lib/email/email-suppression-service";
import {
  resolveTemplateString,
  findMissingRequiredVariables,
} from "../lib/email/email-placeholder-service";
import {
  hasEmailPermission,
  canSendEmailCategory,
} from "../lib/email/email-permissions";
import { sendPlatformEmail } from "../lib/email/email-service";
import { authorizeEmailCron } from "../lib/email/email-cron-auth";
import { authorizeEmailWebhook } from "../lib/email/email-webhook-auth";

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void | Promise<void>) {
  return (async () => {
    try {
      await fn();
      passed += 1;
      console.log(`✓ ${name}`);
    } catch (error) {
      failed += 1;
      console.error(`✗ ${name}`);
      console.error(error);
    }
  })();
}

async function run() {
  console.log("E-Mail-System Tests\n");

  await test("Prisma E-Mail-Modelle verfügbar", async () => {
    assert.equal(typeof prisma.emailMessage?.create, "function");
    assert.equal(typeof prisma.emailTemplate?.findMany, "function");
    assert.equal(typeof prisma.emailProviderConfig?.create, "function");
  });

  await test("Bootstrap legt Defaults an", async () => {
    const created = await ensureEmailSystemDefaults();
    assert.ok(created >= 0);

    const template = await prisma.emailTemplate.findUnique({
      where: { key: "auth.verify" },
    });

    assert.ok(template);
  });

  await test("Empfänger-Maskierung", () => {
    const masked = maskRecipientEmail("max.mustermann@example.com");
    assert.ok(masked.includes("@example.com"));
    assert.ok(masked.includes("***"));
  });

  await test("Suppression blockiert Adresse", async () => {
    const email = `test-suppress-${Date.now()}@example.com`;
    await suppressEmailAddress({
      email,
      reason: "HARD_BOUNCE",
      source: "test",
    });

    assert.equal(await isEmailSuppressed(email), true);
    assert.equal(hashRecipientEmail(email), hashRecipientEmail(email.toUpperCase()));
  });

  await test("Platzhalter werden ersetzt", () => {
    const result = resolveTemplateString(
      "Hallo {{firstName}}, Ticket {{ticketNumber}}",
      { firstName: "Max", ticketNumber: "T-1" },
      ["firstName", "ticketNumber"],
    );

    assert.ok(result.includes("Max"));
    assert.ok(result.includes("T-1"));
  });

  await test("Fehlende Pflichtplatzhalter erkannt", () => {
    const missing = findMissingRequiredVariables("Link: {{actionUrl}}", {});
    assert.deepEqual(missing, ["actionUrl"]);
  });

  await test("Normaler Benutzer darf nicht senden", () => {
    assert.equal(hasEmailPermission("USER", "email.send"), false);
    assert.equal(canSendEmailCategory("USER", "TICKET"), false);
  });

  await test("Support darf Ticket-Mails senden", () => {
    assert.equal(canSendEmailCategory("SUPPORT", "TICKET"), true);
    assert.equal(canSendEmailCategory("SUPPORT", "NEWSLETTER"), false);
  });

  await test("Admin hat alle E-Mail-Rechte", () => {
    assert.equal(hasEmailPermission("ADMIN", "email.bulk.send"), true);
  });

  await test("Cron ohne Secret wird abgewiesen", () => {
    const request = new Request("http://localhost/api/cron/email-queue", {
      method: "POST",
    });

    const auth = authorizeEmailCron(request);
    assert.equal(auth.authorized, false);
  });

  await test("Webhook ohne Secret wird abgewiesen", () => {
    const request = new Request("http://localhost/api/webhooks/email", {
      method: "POST",
    });

    const auth = authorizeEmailWebhook(request);
    assert.equal(auth.authorized, false);
  });

  await test("Webhook mit falschem Bearer wird abgewiesen", () => {
    const previous = process.env.EMAIL_WEBHOOK_SECRET;
    process.env.EMAIL_WEBHOOK_SECRET = "a".repeat(32);

    try {
      const request = new Request("http://localhost/api/webhooks/email", {
        method: "POST",
        headers: { Authorization: "Bearer wrong-secret-value-32chars!!" },
      });

      const auth = authorizeEmailWebhook(request);
      assert.equal(auth.authorized, false);
    } finally {
      if (previous === undefined) {
        delete process.env.EMAIL_WEBHOOK_SECRET;
      } else {
        process.env.EMAIL_WEBHOOK_SECRET = previous;
      }
    }
  });

  await test("sendPlatformEmail legt Queue-Eintrag an", async () => {
    await ensureEmailSystemDefaults();

    const user = await prisma.user.findFirst({ select: { id: true, email: true } });
    assert.ok(user?.email);

    const result = await sendPlatformEmail({
      category: "SYSTEM",
      recipientEmail: user.email,
      recipientUserId: user.id,
      templateKey: "auth.verify",
      variables: {
        firstName: "Test",
        verificationUrl: "https://example.test/verify",
      },
      priority: "HIGH",
      isTest: true,
    });

    assert.ok(result.messageId);

    const row = await prisma.emailMessage.findUnique({
      where: { id: result.messageId },
    });

    assert.ok(row);
    assert.equal(row?.category, "SYSTEM");
    assert.equal(row?.isTest, true);
  });

  console.log(`\n${passed} bestanden, ${failed} fehlgeschlagen`);
  process.exit(failed > 0 ? 1 : 0);
}

void run();
