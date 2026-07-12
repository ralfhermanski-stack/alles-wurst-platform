-- CreateEnum
CREATE TYPE "AccountingProductType" AS ENUM ('membership', 'course', 'workshop', 'manual');

-- CreateEnum
CREATE TYPE "AccountingPositionPaymentStatus" AS ENUM ('pending', 'paid', 'overdue', 'cancelled', 'refunded');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "MembershipAuditAction" ADD VALUE 'position_create';
ALTER TYPE "MembershipAuditAction" ADD VALUE 'position_update';
ALTER TYPE "MembershipAuditAction" ADD VALUE 'position_status_change';

-- CreateTable
CREATE TABLE "accounting_positions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "product_type" "AccountingProductType" NOT NULL,
    "product_name" TEXT NOT NULL,
    "gross_amount" DECIMAL(12,2) NOT NULL,
    "net_amount" DECIMAL(12,2) NOT NULL,
    "tax_rate" DECIMAL(5,2) NOT NULL,
    "tax_amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "payment_status" "AccountingPositionPaymentStatus" NOT NULL DEFAULT 'pending',
    "due_date" TIMESTAMP(3),
    "paid_at" TIMESTAMP(3),
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounting_positions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "accounting_positions_user_id_idx" ON "accounting_positions"("user_id");

-- CreateIndex
CREATE INDEX "accounting_positions_payment_status_idx" ON "accounting_positions"("payment_status");

-- CreateIndex
CREATE INDEX "accounting_positions_product_type_idx" ON "accounting_positions"("product_type");

-- CreateIndex
CREATE INDEX "accounting_positions_due_date_idx" ON "accounting_positions"("due_date");

-- AddForeignKey
ALTER TABLE "accounting_positions" ADD CONSTRAINT "accounting_positions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
