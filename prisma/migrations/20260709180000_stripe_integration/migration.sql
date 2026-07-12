-- Stripe-Integration

CREATE TYPE "StripeActiveMode" AS ENUM ('test', 'live');
CREATE TYPE "StripeWebhookProcessedStatus" AS ENUM ('pending', 'processed', 'ignored', 'failed');

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "stripe_customer_id_test" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "stripe_customer_id_live" TEXT;

ALTER TABLE "payment_intents" ADD COLUMN IF NOT EXISTS "stripe_customer_id" TEXT;
ALTER TABLE "payment_intents" ADD COLUMN IF NOT EXISTS "stripe_checkout_session_id" TEXT;
ALTER TABLE "payment_intents" ADD COLUMN IF NOT EXISTS "stripe_payment_intent_id" TEXT;
ALTER TABLE "payment_intents" ADD COLUMN IF NOT EXISTS "stripe_charge_id" TEXT;
ALTER TABLE "payment_intents" ADD COLUMN IF NOT EXISTS "stripe_subscription_id" TEXT;
ALTER TABLE "payment_intents" ADD COLUMN IF NOT EXISTS "stripe_invoice_id" TEXT;
ALTER TABLE "payment_intents" ADD COLUMN IF NOT EXISTS "customer_name" TEXT;
ALTER TABLE "payment_intents" ADD COLUMN IF NOT EXISTS "customer_email" TEXT;
ALTER TABLE "payment_intents" ADD COLUMN IF NOT EXISTS "billing_address_json" JSONB;
ALTER TABLE "payment_intents" ADD COLUMN IF NOT EXISTS "payment_method_type" TEXT;
ALTER TABLE "payment_intents" ADD COLUMN IF NOT EXISTS "webhook_event_id" TEXT;
ALTER TABLE "payment_intents" ADD COLUMN IF NOT EXISTS "processed_at" TIMESTAMP(3);
ALTER TABLE "payment_intents" ADD COLUMN IF NOT EXISTS "error_message" TEXT;

CREATE INDEX IF NOT EXISTS "payment_intents_stripe_checkout_session_id_idx" ON "payment_intents"("stripe_checkout_session_id");
CREATE INDEX IF NOT EXISTS "payment_intents_stripe_payment_intent_id_idx" ON "payment_intents"("stripe_payment_intent_id");
CREATE INDEX IF NOT EXISTS "payment_intents_webhook_event_id_idx" ON "payment_intents"("webhook_event_id");

CREATE TABLE "stripe_settings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "active_mode" "StripeActiveMode" NOT NULL DEFAULT 'test',
    "last_webhook_at" TIMESTAMP(3),
    "last_webhook_event_id" TEXT,
    "last_stripe_error" TEXT,
    "api_test_ok" BOOLEAN,
    "api_test_checked_at" TIMESTAMP(3),
    "api_live_ok" BOOLEAN,
    "api_live_checked_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stripe_settings_pkey" PRIMARY KEY ("id")
);

INSERT INTO "stripe_settings" ("id", "updated_at")
VALUES ('default', CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

CREATE TABLE "stripe_webhook_events" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "livemode" BOOLEAN NOT NULL DEFAULT false,
    "payload_json" JSONB NOT NULL,
    "processed_status" "StripeWebhookProcessedStatus" NOT NULL DEFAULT 'pending',
    "processed_at" TIMESTAMP(3),
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stripe_webhook_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "stripe_webhook_events_event_id_key" ON "stripe_webhook_events"("event_id");
CREATE INDEX "stripe_webhook_events_event_type_idx" ON "stripe_webhook_events"("event_type");
CREATE INDEX "stripe_webhook_events_processed_status_idx" ON "stripe_webhook_events"("processed_status");
CREATE INDEX "stripe_webhook_events_created_at_idx" ON "stripe_webhook_events"("created_at");
