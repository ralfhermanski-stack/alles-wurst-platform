-- CreateEnum
CREATE TYPE "MembershipCancelReason" AS ENUM ('user_request', 'account_deletion', 'admin', 'stripe_sync', 'payment_failed');

-- CreateEnum
CREATE TYPE "MembershipRenewalReminderStatus" AS ENUM ('sent', 'skipped', 'failed', 'suppressed');

-- AlterEnum
ALTER TYPE "AccountDeletionPlanStatus" ADD VALUE 'SCHEDULED';

-- AlterTable
ALTER TABLE "memberships" ADD COLUMN "billing_period" "BillingPeriod",
ADD COLUMN "auto_renew_enabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "cancel_at_period_end" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "cancel_reason" "MembershipCancelReason",
ADD COLUMN "cancel_requested_at" TIMESTAMP(3),
ADD COLUMN "renewal_reminders_suppressed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "last_renewal_reminder_for_period_end" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "account_deletion_plans" ADD COLUMN "scheduled_execution_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "membership_renewal_reminder_logs" (
    "id" TEXT NOT NULL,
    "membership_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "billing_period" "BillingPeriod" NOT NULL,
    "period_end_at" TIMESTAMP(3) NOT NULL,
    "lead_days" INTEGER NOT NULL,
    "status" "MembershipRenewalReminderStatus" NOT NULL,
    "skip_reason" TEXT,
    "error_message" TEXT,
    "triggered_by" TEXT NOT NULL DEFAULT 'cron',
    "actor_user_id" UUID,
    "email_message_id" TEXT,
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "membership_renewal_reminder_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "memberships_cancel_at_period_end_idx" ON "memberships"("cancel_at_period_end");

-- CreateIndex
CREATE INDEX "memberships_extended_until_idx" ON "memberships"("extended_until");

-- CreateIndex
CREATE INDEX "memberships_ends_at_idx" ON "memberships"("ends_at");

-- CreateIndex
CREATE UNIQUE INDEX "membership_renewal_reminder_logs_membership_id_period_end_at_lead_days_key" ON "membership_renewal_reminder_logs"("membership_id", "period_end_at", "lead_days");

-- CreateIndex
CREATE INDEX "membership_renewal_reminder_logs_user_id_idx" ON "membership_renewal_reminder_logs"("user_id");

-- CreateIndex
CREATE INDEX "membership_renewal_reminder_logs_status_idx" ON "membership_renewal_reminder_logs"("status");

-- CreateIndex
CREATE INDEX "membership_renewal_reminder_logs_period_end_at_idx" ON "membership_renewal_reminder_logs"("period_end_at");

-- CreateIndex
CREATE INDEX "membership_renewal_reminder_logs_created_at_idx" ON "membership_renewal_reminder_logs"("created_at");

-- CreateIndex
CREATE INDEX "account_deletion_plans_scheduled_execution_at_idx" ON "account_deletion_plans"("scheduled_execution_at");

-- AddForeignKey
ALTER TABLE "membership_renewal_reminder_logs" ADD CONSTRAINT "membership_renewal_reminder_logs_membership_id_fkey" FOREIGN KEY ("membership_id") REFERENCES "memberships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership_renewal_reminder_logs" ADD CONSTRAINT "membership_renewal_reminder_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
