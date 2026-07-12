/**
 * Automatisierte Tests: Rechtstexte, Sanitizing, Sync, Checkout, Widerruf.
 */

import assert from "node:assert/strict";

import { prisma } from "../lib/db/prisma";
import { computeLegalChecksum } from "../lib/legal/legal-checksum";
import { normalizeLegalContent } from "../lib/legal/legal-html-sanitize";
import {
  ensureDefaultLegalDocuments,
  getPublishedLegalDocumentBySlug,
  importLegalDocumentVersion,
} from "../lib/legal/legal-document-service";
import { validateCheckoutLegalRequirements } from "../lib/legal/legal-checkout-service";
import { createWithdrawalRequest } from "../lib/legal/legal-withdrawal-service";

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
  console.log("Rechtstexte-System Tests\n");

  await test("HTML-Sanitizer entfernt script-Tags", () => {
    const sanitized = normalizeLegalContent(
      '<p>OK</p><script>alert(1)</script>',
      "HTML",
    );
    assert.ok(!sanitized.includes("<script"));
    assert.ok(sanitized.includes("OK"));
  });

  await test("Prüfsumme ist deterministisch", () => {
    const a = computeLegalChecksum("test");
    const b = computeLegalChecksum("test");
    assert.equal(a, b);
    assert.notEqual(a, computeLegalChecksum("test2"));
  });

  await test("Standard-Rechtsdokumente werden angelegt", async () => {
    await ensureDefaultLegalDocuments();
    const impressum = await prisma.legalDocument.findUnique({
      where: { slug: "impressum" },
    });
    assert.ok(impressum);
  });

  await test("Entwurf wird nicht als veröffentlicht ausgeliefert", async () => {
    const view = await getPublishedLegalDocumentBySlug("agb");
    assert.ok(view);
    assert.equal(view.hasPublishedContent, false);
  });

  await test("Veröffentlichte Version wird angezeigt", async () => {
    const doc = await prisma.legalDocument.findUnique({
      where: { slug: "agb" },
    });
    assert.ok(doc);

    await importLegalDocumentVersion({
      documentId: doc.id,
      content: "<p>Test-AGB Platzhalter — rechtlich prüfen.</p>",
      contentFormat: "HTML",
      autoPublish: true,
    });

    const view = await getPublishedLegalDocumentBySlug("agb");
    assert.ok(view?.hasPublishedContent);
    assert.ok(view.contentHtml.includes("Test-AGB"));
  });

  await test("Unveränderter Import erzeugt keine neue Version", async () => {
    const doc = await prisma.legalDocument.findUnique({
      where: { slug: "agb" },
    });
    assert.ok(doc);

    const before = await prisma.legalDocumentVersion.count({
      where: { documentId: doc.id },
    });

    await importLegalDocumentVersion({
      documentId: doc.id,
      content: "<p>Test-AGB Platzhalter — rechtlich prüfen.</p>",
      contentFormat: "HTML",
    });

    const after = await prisma.legalDocumentVersion.count({
      where: { documentId: doc.id },
    });

    assert.equal(before, after);
  });

  await test("Checkout ohne AGB-Zustimmung schlägt fehl", async () => {
    const result = await validateCheckoutLegalRequirements({
      productKind: "course",
      legalConfig: null,
      consents: {
        termsAccepted: false,
        privacyAcknowledged: true,
      },
    });

    assert.equal(result.success, false);
  });

  await test("Ohne Sofortzustimmung: verzögerter Zugang", async () => {
    const result = await validateCheckoutLegalRequirements({
      productKind: "course",
      legalConfig: null,
      consents: {
        termsAccepted: true,
        privacyAcknowledged: true,
        immediateAccessConsent: false,
        withdrawalLossAcknowledged: false,
      },
    });

    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data.accessMode, "DELAYED");
      assert.ok(result.data.pendingAccessUntil);
    }
  });

  await test("Mit beiden Sofortzustimmungen: sofortiger Zugang", async () => {
    const result = await validateCheckoutLegalRequirements({
      productKind: "course",
      legalConfig: null,
      consents: {
        termsAccepted: true,
        privacyAcknowledged: true,
        immediateAccessConsent: true,
        withdrawalLossAcknowledged: true,
      },
    });

    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data.accessMode, "IMMEDIATE");
    }
  });

  await test("Widerruf erzeugt Vorgangsnummer", async () => {
    const result = await createWithdrawalRequest({
      firstName: "Test",
      lastName: "Nutzer",
      email: "test-widerruf@example.com",
      message: "Hiermit widerrufe ich den Vertrag.",
    });

    assert.equal(result.success, true);
    if (result.success) {
      assert.ok(result.data.withdrawalNumber.startsWith("WR-"));
    }
  });

  await test("Widerruf ohne Grund ist möglich", async () => {
    const result = await createWithdrawalRequest({
      firstName: "Test",
      lastName: "Nutzer",
      email: "test-widerruf2@example.com",
      message: "Widerruf ohne Begründung.",
    });

    assert.equal(result.success, true);
  });

  console.log(`\n${passed} bestanden, ${failed} fehlgeschlagen`);

  if (failed > 0) {
    process.exit(1);
  }
}

void run();
