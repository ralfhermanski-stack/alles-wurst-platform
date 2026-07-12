-- CreateEnum
CREATE TYPE "MembershipAuditAction" AS ENUM ('membership_pause', 'membership_reactivate', 'membership_extend', 'membership_end', 'membership_block', 'membership_unlock', 'payment_status_change', 'role_change', 'payment_note', 'accounting_note', 'manual_update');

-- CreateTable
CREATE TABLE "membership_audit_logs" (
    "id" UUID NOT NULL,
    "target_user_id" UUID NOT NULL,
    "actor_user_id" UUID NOT NULL,
    "actor_role" "MembershipRole" NOT NULL,
    "action" "MembershipAuditAction" NOT NULL,
    "summary" TEXT NOT NULL,
    "previous_values" JSONB,
    "new_values" JSONB,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "membership_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "membership_audit_logs_target_user_id_idx" ON "membership_audit_logs"("target_user_id");

-- CreateIndex
CREATE INDEX "membership_audit_logs_actor_user_id_idx" ON "membership_audit_logs"("actor_user_id");

-- CreateIndex
CREATE INDEX "membership_audit_logs_created_at_idx" ON "membership_audit_logs"("created_at");

-- AddForeignKey
ALTER TABLE "membership_audit_logs" ADD CONSTRAINT "membership_audit_logs_target_user_id_fkey" FOREIGN KEY ("target_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
