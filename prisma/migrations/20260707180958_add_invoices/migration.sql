-- AlterEnum
ALTER TYPE "MembershipAuditAction" ADD VALUE 'invoice_create';

-- CreateTable
CREATE TABLE "invoice_sequences" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "current_number" INTEGER NOT NULL DEFAULT 0,
    "prefix" TEXT NOT NULL DEFAULT 'RE',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoice_sequences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" UUID NOT NULL,
    "invoice_number" TEXT NOT NULL,
    "sequence_number" INTEGER NOT NULL,
    "sequence_year" INTEGER NOT NULL,
    "accounting_position_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "invoice_date" TIMESTAMP(3) NOT NULL,
    "service_date" TIMESTAMP(3) NOT NULL,
    "due_date" TIMESTAMP(3),
    "payment_status" "AccountingPositionPaymentStatus" NOT NULL,
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

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "invoices_invoice_number_key" ON "invoices"("invoice_number");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_accounting_position_id_key" ON "invoices"("accounting_position_id");

-- CreateIndex
CREATE INDEX "invoices_user_id_idx" ON "invoices"("user_id");

-- CreateIndex
CREATE INDEX "invoices_invoice_number_idx" ON "invoices"("invoice_number");

-- CreateIndex
CREATE INDEX "invoices_invoice_date_idx" ON "invoices"("invoice_date");

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_accounting_position_id_fkey" FOREIGN KEY ("accounting_position_id") REFERENCES "accounting_positions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "invoice_sequences" ("id", "current_number", "prefix", "updated_at")
VALUES ('default', 0, 'RE', CURRENT_TIMESTAMP);
