-- AlterEnum
ALTER TYPE "MembershipAuditAction" ADD VALUE 'invoice_cancel';
ALTER TYPE "MembershipAuditAction" ADD VALUE 'credit_note_create';

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('draft', 'issued', 'paid', 'cancelled', 'refunded');

-- AlterTable
ALTER TABLE "invoices" ADD COLUMN "status" "InvoiceStatus" NOT NULL DEFAULT 'issued';
ALTER TABLE "invoices" ADD COLUMN "cancelled_at" TIMESTAMP(3);

-- Backfill status from payment snapshot
UPDATE "invoices"
SET "status" = CASE
  WHEN "payment_status" = 'paid' THEN 'paid'::"InvoiceStatus"
  ELSE 'issued'::"InvoiceStatus"
END;

-- CreateIndex
CREATE INDEX "invoices_status_idx" ON "invoices"("status");

-- CreateTable
CREATE TABLE "credit_note_sequences" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "current_number" INTEGER NOT NULL DEFAULT 0,
    "prefix" TEXT NOT NULL DEFAULT 'GS',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "credit_note_sequences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_notes" (
    "id" UUID NOT NULL,
    "credit_note_number" TEXT NOT NULL,
    "sequence_number" INTEGER NOT NULL,
    "sequence_year" INTEGER NOT NULL,
    "invoice_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "credit_note_date" TIMESTAMP(3) NOT NULL,
    "reference_invoice_number" TEXT NOT NULL,
    "customer_snapshot" JSONB NOT NULL,
    "product_type" "AccountingProductType" NOT NULL,
    "product_name" TEXT NOT NULL,
    "net_amount" DECIMAL(12,2) NOT NULL,
    "tax_rate" DECIMAL(5,2) NOT NULL,
    "tax_amount" DECIMAL(12,2) NOT NULL,
    "gross_amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "note_text" TEXT,
    "created_by_user_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "credit_notes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "credit_notes_credit_note_number_key" ON "credit_notes"("credit_note_number");

-- CreateIndex
CREATE UNIQUE INDEX "credit_notes_invoice_id_key" ON "credit_notes"("invoice_id");

-- CreateIndex
CREATE INDEX "credit_notes_user_id_idx" ON "credit_notes"("user_id");

-- CreateIndex
CREATE INDEX "credit_notes_credit_note_number_idx" ON "credit_notes"("credit_note_number");

-- CreateIndex
CREATE INDEX "credit_notes_credit_note_date_idx" ON "credit_notes"("credit_note_date");

-- AddForeignKey
ALTER TABLE "credit_notes" ADD CONSTRAINT "credit_notes_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_notes" ADD CONSTRAINT "credit_notes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "credit_note_sequences" ("id", "current_number", "prefix", "updated_at")
VALUES ('default', 0, 'GS', CURRENT_TIMESTAMP);
