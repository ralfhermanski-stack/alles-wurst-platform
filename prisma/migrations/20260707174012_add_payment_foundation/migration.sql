-- CreateEnum
CREATE TYPE "ProductKind" AS ENUM ('membership_wurstclub', 'membership_meisterclub', 'course', 'workshop');

-- CreateEnum
CREATE TYPE "BillingPeriod" AS ENUM ('one_time', 'monthly', 'yearly');

-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('stripe', 'paypal', 'bank_transfer', 'manual');

-- CreateEnum
CREATE TYPE "CheckoutIntentStatus" AS ENUM ('created', 'awaiting_payment', 'processing', 'succeeded', 'failed', 'cancelled', 'expired');

-- CreateEnum
CREATE TYPE "PaymentIntentStatus" AS ENUM ('created', 'awaiting_payment', 'processing', 'succeeded', 'failed', 'cancelled', 'expired');

-- CreateEnum
CREATE TYPE "CourseAccessStatus" AS ENUM ('pending', 'active', 'revoked', 'expired');

-- CreateEnum
CREATE TYPE "CourseAccessSource" AS ENUM ('payment', 'manual', 'accounting');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "MembershipAuditAction" ADD VALUE 'checkout_create';
ALTER TYPE "MembershipAuditAction" ADD VALUE 'payment_intent_create';
ALTER TYPE "MembershipAuditAction" ADD VALUE 'payment_fulfillment';

-- AlterTable
ALTER TABLE "accounting_positions" ADD COLUMN     "payment_provider" "PaymentProvider",
ADD COLUMN     "product_price_id" UUID;

-- CreateTable
CREATE TABLE "products" (
    "id" UUID NOT NULL,
    "kind" "ProductKind" NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "external_ref" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_prices" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "gross_amount" DECIMAL(12,2) NOT NULL,
    "net_amount" DECIMAL(12,2) NOT NULL,
    "tax_rate" DECIMAL(5,2) NOT NULL,
    "tax_amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "billing_period" "BillingPeriod" NOT NULL DEFAULT 'one_time',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "valid_from" TIMESTAMP(3),
    "valid_until" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_prices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checkout_intents" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "product_price_id" UUID NOT NULL,
    "payment_provider" "PaymentProvider" NOT NULL,
    "status" "CheckoutIntentStatus" NOT NULL DEFAULT 'created',
    "gross_amount" DECIMAL(12,2) NOT NULL,
    "net_amount" DECIMAL(12,2) NOT NULL,
    "tax_rate" DECIMAL(5,2) NOT NULL,
    "tax_amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "accounting_position_id" UUID,
    "provider_metadata" JSONB,
    "expires_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "checkout_intents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_intents" (
    "id" UUID NOT NULL,
    "checkout_intent_id" UUID NOT NULL,
    "payment_provider" "PaymentProvider" NOT NULL,
    "status" "PaymentIntentStatus" NOT NULL DEFAULT 'created',
    "provider_reference" TEXT,
    "gross_amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "accounting_position_id" UUID,
    "provider_metadata" JSONB,
    "paid_at" TIMESTAMP(3),
    "failed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_intents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_access" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "status" "CourseAccessStatus" NOT NULL DEFAULT 'pending',
    "source" "CourseAccessSource" NOT NULL,
    "checkout_intent_id" UUID,
    "accounting_position_id" UUID,
    "granted_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_access_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "products_slug_key" ON "products"("slug");

-- CreateIndex
CREATE INDEX "products_kind_idx" ON "products"("kind");

-- CreateIndex
CREATE INDEX "products_active_idx" ON "products"("active");

-- CreateIndex
CREATE INDEX "product_prices_product_id_idx" ON "product_prices"("product_id");

-- CreateIndex
CREATE INDEX "product_prices_active_idx" ON "product_prices"("active");

-- CreateIndex
CREATE UNIQUE INDEX "checkout_intents_accounting_position_id_key" ON "checkout_intents"("accounting_position_id");

-- CreateIndex
CREATE INDEX "checkout_intents_user_id_idx" ON "checkout_intents"("user_id");

-- CreateIndex
CREATE INDEX "checkout_intents_status_idx" ON "checkout_intents"("status");

-- CreateIndex
CREATE INDEX "checkout_intents_payment_provider_idx" ON "checkout_intents"("payment_provider");

-- CreateIndex
CREATE INDEX "checkout_intents_expires_at_idx" ON "checkout_intents"("expires_at");

-- CreateIndex
CREATE INDEX "payment_intents_checkout_intent_id_idx" ON "payment_intents"("checkout_intent_id");

-- CreateIndex
CREATE INDEX "payment_intents_status_idx" ON "payment_intents"("status");

-- CreateIndex
CREATE INDEX "payment_intents_payment_provider_idx" ON "payment_intents"("payment_provider");

-- CreateIndex
CREATE INDEX "payment_intents_provider_reference_idx" ON "payment_intents"("provider_reference");

-- CreateIndex
CREATE INDEX "payment_intents_accounting_position_id_idx" ON "payment_intents"("accounting_position_id");

-- CreateIndex
CREATE INDEX "course_access_status_idx" ON "course_access"("status");

-- CreateIndex
CREATE INDEX "course_access_checkout_intent_id_idx" ON "course_access"("checkout_intent_id");

-- CreateIndex
CREATE UNIQUE INDEX "course_access_user_id_product_id_key" ON "course_access"("user_id", "product_id");

-- CreateIndex
CREATE INDEX "accounting_positions_product_price_id_idx" ON "accounting_positions"("product_price_id");

-- CreateIndex
CREATE INDEX "accounting_positions_payment_provider_idx" ON "accounting_positions"("payment_provider");

-- AddForeignKey
ALTER TABLE "accounting_positions" ADD CONSTRAINT "accounting_positions_product_price_id_fkey" FOREIGN KEY ("product_price_id") REFERENCES "product_prices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_prices" ADD CONSTRAINT "product_prices_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checkout_intents" ADD CONSTRAINT "checkout_intents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checkout_intents" ADD CONSTRAINT "checkout_intents_product_price_id_fkey" FOREIGN KEY ("product_price_id") REFERENCES "product_prices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checkout_intents" ADD CONSTRAINT "checkout_intents_accounting_position_id_fkey" FOREIGN KEY ("accounting_position_id") REFERENCES "accounting_positions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_intents" ADD CONSTRAINT "payment_intents_checkout_intent_id_fkey" FOREIGN KEY ("checkout_intent_id") REFERENCES "checkout_intents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_intents" ADD CONSTRAINT "payment_intents_accounting_position_id_fkey" FOREIGN KEY ("accounting_position_id") REFERENCES "accounting_positions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_access" ADD CONSTRAINT "course_access_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_access" ADD CONSTRAINT "course_access_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_access" ADD CONSTRAINT "course_access_checkout_intent_id_fkey" FOREIGN KEY ("checkout_intent_id") REFERENCES "checkout_intents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed: Standard-Produktkatalog (Mitgliedschaften, Kurse, Workshops)
INSERT INTO "products" ("id", "kind", "slug", "name", "description", "active", "sort_order", "updated_at")
VALUES
  ('a1000000-0000-4000-8000-000000000001', 'membership_wurstclub', 'wurstclub', 'Wurstclub', 'Club-Mitgliedschaft mit erweitertem Rezeptzugang.', true, 10, CURRENT_TIMESTAMP),
  ('a1000000-0000-4000-8000-000000000002', 'membership_meisterclub', 'meisterclub', 'Meisterclub', 'Premium-Mitgliedschaft mit Rezeptdatenbank und Club-Inhalten.', true, 20, CURRENT_TIMESTAMP),
  ('a1000000-0000-4000-8000-000000000003', 'course', 'beispielkurs', 'Beispielkurs Wurstgrundlagen', 'Einführungskurs in die Wurstherstellung (Platzhalter).', true, 30, CURRENT_TIMESTAMP),
  ('a1000000-0000-4000-8000-000000000004', 'workshop', 'beispiel-workshop', 'Beispiel-Workshop Räuchern', 'Praxis-Workshop zum Räuchern (Platzhalter).', true, 40, CURRENT_TIMESTAMP);

INSERT INTO "product_prices" ("id", "product_id", "gross_amount", "net_amount", "tax_rate", "tax_amount", "currency", "billing_period", "active", "updated_at")
VALUES
  ('b1000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001', 9.99, 8.39, 19.00, 1.60, 'EUR', 'monthly', true, CURRENT_TIMESTAMP),
  ('b1000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000001', 99.00, 83.19, 19.00, 15.81, 'EUR', 'yearly', true, CURRENT_TIMESTAMP),
  ('b1000000-0000-4000-8000-000000000003', 'a1000000-0000-4000-8000-000000000002', 19.99, 16.80, 19.00, 3.19, 'EUR', 'monthly', true, CURRENT_TIMESTAMP),
  ('b1000000-0000-4000-8000-000000000004', 'a1000000-0000-4000-8000-000000000002', 199.00, 167.23, 19.00, 31.77, 'EUR', 'yearly', true, CURRENT_TIMESTAMP),
  ('b1000000-0000-4000-8000-000000000005', 'a1000000-0000-4000-8000-000000000003', 49.00, 41.18, 19.00, 7.82, 'EUR', 'one_time', true, CURRENT_TIMESTAMP),
  ('b1000000-0000-4000-8000-000000000006', 'a1000000-0000-4000-8000-000000000004', 129.00, 108.40, 19.00, 20.60, 'EUR', 'one_time', true, CURRENT_TIMESTAMP);
