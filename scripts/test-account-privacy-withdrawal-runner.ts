/**
 * Automatisierte Tests: Widerruf im Konto, Vertragsunterlagen, Datenschutz.
 */

import "dotenv/config";

import assert from "node:assert/strict";

import { prisma } from "../lib/db/prisma";
import {
  createOrderAccessToken,
  verifyOrderAccessToken,
} from "../lib/account/secure-order-token";
import { getUserOrderDetail } from "../lib/account/account-order-service";
import { computeLegalChecksum } from "../lib/legal/legal-checksum";
import {
  resolveWithdrawalPrefill,
  submitAccountWithdrawal,
} from "../lib/legal/withdrawal-account-service";
import { buildAccountDeletionPlan } from "../lib/privacy/account-deletion-service";
import { ensurePlatformTextDefaults } from "../lib/platform-text/platform-text-service";

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
  process.env.NODE_ENV ??= "development";

  console.log("Account / Widerruf / Datenschutz Tests\n");

  await test("Prisma Privacy-Modelle verfügbar", async () => {
    assert.equal(typeof prisma.privacyRequest?.create, "function");
    assert.equal(typeof prisma.orderLegalDocument?.findMany, "function");
    assert.equal(typeof prisma.userAccountMessage?.create, "function");
  });

  await test("Order-Token ist signiert und verifizierbar", () => {
    const token = createOrderAccessToken("user-1", "order-1");
    const payload = verifyOrderAccessToken(token);
    assert.ok(payload);
    assert.equal(payload?.userId, "user-1");
    assert.equal(payload?.orderId, "order-1");
  });

  await test("Manipulierter Token wird abgewiesen", () => {
    const token = createOrderAccessToken("user-1", "order-1");
    const tampered = `${token}x`;
    assert.equal(verifyOrderAccessToken(tampered), null);
  });

  await test("Fremder Nutzer kann Token nicht für fremde Bestellung nutzen", async () => {
    const paidOrder = await prisma.accountingPosition.findFirst({
      where: { paymentStatus: "paid" },
      select: { id: true, userId: true },
    });

    if (!paidOrder?.userId) {
      console.log("  (übersprungen: keine bezahlte Bestellung in DB)");
      return;
    }

    const otherUser = await prisma.user.findFirst({
      where: { id: { not: paidOrder.userId } },
      select: { id: true },
    });

    if (!otherUser) {
      console.log("  (übersprungen: kein zweiter Nutzer)");
      return;
    }

    const token = createOrderAccessToken(paidOrder.userId, paidOrder.id);
    const prefill = await resolveWithdrawalPrefill({
      userId: otherUser.id,
      token,
    });

    assert.equal(prefill.success, false);
  });

  await test("Eigene Bestelldetails nur für Besitzer", async () => {
    const paidOrder = await prisma.accountingPosition.findFirst({
      where: { paymentStatus: "paid" },
      select: { id: true, userId: true },
    });

    if (!paidOrder?.userId) {
      console.log("  (übersprungen: keine bezahlte Bestellung)");
      return;
    }

    const own = await getUserOrderDetail(paidOrder.userId, paidOrder.id);
    assert.equal(own.success, true);

    const otherUser = await prisma.user.findFirst({
      where: { id: { not: paidOrder.userId } },
      select: { id: true },
    });

    if (!otherUser) {
      return;
    }

    const foreign = await getUserOrderDetail(otherUser.id, paidOrder.id);
    assert.equal(foreign.success, false);
  });

  await test("Prüfsumme bleibt stabil", () => {
    const checksum = computeLegalChecksum("snapshot-content");
    assert.equal(checksum, computeLegalChecksum("snapshot-content"));
    assert.notEqual(checksum, computeLegalChecksum("other"));
  });

  await test("Löschplan unterscheidet Kategorien", async () => {
    const user = await prisma.user.findFirst({ select: { id: true } });
    assert.ok(user);

    const plan = await buildAccountDeletionPlan(user.id);
    assert.ok(plan.deletable.length > 0);
    assert.ok(plan.retained.length > 0);
    assert.ok(Array.isArray(plan.blocking));
  });

  await test("Plattform-Textschlüssel für Account/Privacy vorhanden", async () => {
    const created = await ensurePlatformTextDefaults();
    assert.ok(created >= 0);

    const key = await prisma.platformText.findUnique({
      where: { key: "privacy.center.title" },
    });

    assert.ok(key);
  });

  await test("Widerruf aus Konto erzeugt Vorgang ohne Auto-Erstattung", async () => {
    const paidOrder = await prisma.accountingPosition.findFirst({
      where: { paymentStatus: "paid" },
      include: { checkoutIntent: true },
    });

    if (!paidOrder?.userId) {
      console.log("  (übersprungen: keine bezahlte Bestellung)");
      return;
    }

    const existing = await prisma.withdrawalRequest.findFirst({
      where: {
        accountingPositionId: paidOrder.id,
        status: { in: ["RECEIVED", "UNDER_REVIEW"] },
      },
    });

    if (existing) {
      console.log("  (übersprungen: offener Widerruf vorhanden)");
      return;
    }

    const detail = await getUserOrderDetail(paidOrder.userId, paidOrder.id);

    if (!detail.success || !detail.data.withdrawalEligible) {
      console.log("  (übersprungen: Bestellung nicht widerrufsfähig)");
      return;
    }

    const token = createOrderAccessToken(paidOrder.userId, paidOrder.id);
    const result = await submitAccountWithdrawal({
      userId: paidOrder.userId,
      token,
      declarationText: "Hiermit widerrufe ich den Vertrag (Test).",
      confirmed: true,
    });

    assert.equal(result.success, true);

    if (result.success) {
      const withdrawal = await prisma.withdrawalRequest.findFirst({
        where: { withdrawalNumber: result.data.withdrawalNumber },
        include: { supportTicket: true },
      });

      assert.ok(withdrawal);
      assert.equal(withdrawal?.status, "RECEIVED");
      assert.equal(withdrawal?.source, "USER_ACCOUNT");
      assert.equal(withdrawal?.stripeRefundId, null);

      if (withdrawal?.supportTicket) {
        assert.equal(withdrawal.supportTicket.priority, "urgent");
      }
    }
  });

  console.log(`\n${passed} bestanden, ${failed} fehlgeschlagen`);
  process.exit(failed > 0 ? 1 : 0);
}

void run();
