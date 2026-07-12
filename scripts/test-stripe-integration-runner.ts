/**
 * Stripe-Integration — automatisierte Tests (ohne echte Stripe-API).
 */

import assert from "node:assert/strict";

import {
  buildClientReferenceId,
  buildStripeMetadata,
  parseStripeMetadata,
  resolveStripeProductType,
} from "../lib/stripe/stripe-metadata";
import {
  getStripePublishableKey,
  getStripeServerKey,
  getStripeWebhookSecret,
} from "../lib/stripe/stripe-config";
import {
  detectStripeKeyKind,
  isForbiddenInFrontendKey,
  maskStripeKey,
} from "../lib/stripe/stripe-key-types";
import {
  getStripeModeKeyReport,
  validateStripeModeKeys,
} from "../lib/stripe/stripe-key-validation";
import { getStripeWebhookUrl } from "../lib/stripe/stripe-settings-service";
import { processStripeWebhook } from "../lib/stripe/stripe-webhook-service";

function setTestKeys(): void {
  process.env.STRIPE_PUBLISHABLE_KEY_TEST = "pk_test_abcdefghijklmnopqrst";
  process.env.STRIPE_RESTRICTED_KEY_TEST = "rk_test_abcdefghijklmnopqrst";
  process.env.STRIPE_WEBHOOK_SECRET_TEST = "whsec_testsecret123456";
  delete process.env.STRIPE_SECRET_KEY_TEST;
  delete process.env.STRIPE_PUBLISHABLE_KEY_LIVE;
  delete process.env.STRIPE_RESTRICTED_KEY_LIVE;
  delete process.env.STRIPE_SECRET_KEY_LIVE;
  delete process.env.STRIPE_WEBHOOK_SECRET_LIVE;
}

async function test(name: string, fn: () => void | Promise<void>): Promise<void> {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`  ✗ ${name}: ${message}`);
    throw error;
  }
}

async function run(): Promise<void> {
  console.log("Stripe-Integration Tests\n");

  let passed = 0;
  const cases: Array<[string, () => void | Promise<void>]> = [
    [
      "resolveStripeProductType — Mitgliedschaft",
      () => {
        assert.equal(
          resolveStripeProductType("membership_wurstclub"),
          "membership",
        );
      },
    ],
    [
      "buildStripeMetadata — Pflichtfelder",
      () => {
        const meta = buildStripeMetadata({
          user_id: "u1",
          user_email: "a@b.de",
          user_name: "Max",
          course_id: "",
          membership_id: "",
          order_id: "order-1",
          internal_booking_id: "pos-1",
          product_type: "course",
          product_name: "Kurs A",
          amount: "49.00",
          currency: "EUR",
          billing_reference: "pos-1",
          environment: "test",
          product_id: "p1",
          product_price_id: "pp1",
          payment_intent_id: "pi1",
        });

        assert.equal(meta.source, "alles-wurst");
      },
    ],
    [
      "maskStripeKey — maskiert korrekt",
      () => {
        const masked = maskStripeKey("pk_live_abcdefghijklmnopqrstuvwx");

        assert.ok(masked?.includes("****"));
        assert.ok(masked?.startsWith("pk_live_"));
        assert.ok(!masked?.includes("abcdefghijklmnopqrst"));
      },
    ],
    [
      "detectStripeKeyKind — alle Typen",
      () => {
        assert.equal(detectStripeKeyKind("pk_test_x"), "publishable");
        assert.equal(detectStripeKeyKind("rk_live_x"), "restricted");
        assert.equal(detectStripeKeyKind("sk_test_x"), "secret");
        assert.equal(detectStripeKeyKind("whsec_x"), "webhook");
      },
    ],
    [
      "Testmodus mit pk_test + rk_test — erlaubt",
      () => {
        setTestKeys();
        const report = validateStripeModeKeys("test");

        assert.equal(report.checkoutAllowed, true);
        assert.equal(report.serverKeyType, "restricted");
      },
    ],
    [
      "Testmodus mit pk_live — blockiert",
      () => {
        setTestKeys();
        process.env.STRIPE_PUBLISHABLE_KEY_TEST = "pk_live_abcdefghijklmnopqrst";

        const report = validateStripeModeKeys("test");

        assert.equal(report.checkoutAllowed, false);
        assert.ok(report.errors.length > 0);
      },
    ],
    [
      "Livemodus mit pk_live + rk_live — erlaubt",
      () => {
        process.env.STRIPE_PUBLISHABLE_KEY_LIVE = "pk_live_abcdefghijklmnopqrst";
        process.env.STRIPE_RESTRICTED_KEY_LIVE = "rk_live_abcdefghijklmnopqrst";
        process.env.STRIPE_WEBHOOK_SECRET_LIVE = "whsec_livesecret123456";

        const report = validateStripeModeKeys("live");

        assert.equal(report.checkoutAllowed, true);
      },
    ],
    [
      "Livemodus mit pk_test — blockiert",
      () => {
        process.env.STRIPE_PUBLISHABLE_KEY_LIVE = "pk_test_abcdefghijklmnopqrst";
        process.env.STRIPE_RESTRICTED_KEY_LIVE = "rk_live_abcdefghijklmnopqrst";
        process.env.STRIPE_WEBHOOK_SECRET_LIVE = "whsec_livesecret123456";

        const report = validateStripeModeKeys("live");

        assert.equal(report.checkoutAllowed, false);
      },
    ],
    [
      "Fehlendes Webhook Secret — Checkout blockiert",
      () => {
        setTestKeys();
        delete process.env.STRIPE_WEBHOOK_SECRET_TEST;

        const report = validateStripeModeKeys("test");

        assert.equal(report.checkoutAllowed, false);
        assert.equal(report.webhookSecretPresent, false);
      },
    ],
    [
      "Secret Key Fallback ohne Restricted Key",
      () => {
        setTestKeys();
        delete process.env.STRIPE_RESTRICTED_KEY_TEST;
        process.env.STRIPE_SECRET_KEY_TEST = "sk_test_abcdefghijklmnopqrst";

        const server = getStripeServerKey("test");
        const report = validateStripeModeKeys("test");

        assert.equal(server.type, "secret");
        assert.equal(report.checkoutAllowed, true);
        assert.ok(
          report.warnings.some((warning) => warning.includes("Restricted")),
        );
      },
    ],
    [
      "Forbidden keys im Frontend",
      () => {
        assert.equal(isForbiddenInFrontendKey("sk_test_x"), true);
        assert.equal(isForbiddenInFrontendKey("rk_live_x"), true);
        assert.equal(isForbiddenInFrontendKey("whsec_x"), true);
        assert.equal(isForbiddenInFrontendKey("pk_test_x"), false);
      },
    ],
    [
      "Webhook-URL",
      () => {
        assert.ok(getStripeWebhookUrl().endsWith("/api/stripe/webhook"));
      },
    ],
    [
      "Webhook lehnt fehlende Signatur ab",
      async () => {
        await assert.rejects(
          () => processStripeWebhook("{}", null),
          /Signatur/,
        );
      },
    ],
    [
      "Webhook lehnt ungültige Signatur ab",
      async () => {
        process.env.STRIPE_WEBHOOK_SECRET_TEST = "whsec_test_invalid";

        await assert.rejects(
          () => processStripeWebhook('{"livemode":false}', "t=1,v1=invalid"),
          /Ungültige/,
        );
      },
    ],
    [
      "getStripeModeKeyReport — Cache",
      () => {
        setTestKeys();
        const report = getStripeModeKeyReport("test", true);

        assert.equal(typeof report.checkoutAllowed, "boolean");
      },
    ],
    [
      "Publishable Key getrennt von Server Key",
      () => {
        setTestKeys();

        const pk = getStripePublishableKey("test");
        const server = getStripeServerKey("test");

        assert.ok(pk?.startsWith("pk_"));
        assert.ok(server.key?.startsWith("rk_"));
        assert.notEqual(pk, server.key);
      },
    ],
    [
      "Webhook Secret ist kein API-Key",
      () => {
        setTestKeys();
        const webhook = getStripeWebhookSecret("test");
        const server = getStripeServerKey("test");

        assert.ok(webhook?.startsWith("whsec_"));
        assert.notEqual(webhook, server.key);
      },
    ],
  ];

  for (const [name, fn] of cases) {
    await test(name, fn);
    passed += 1;
  }

  console.log(`\n${passed} bestanden, 0 fehlgeschlagen`);
}

run().catch(() => {
  process.exit(1);
});
