-- Betatest: Einladungen und Tester-Aufträge

CREATE TYPE "BetaInviteStatus" AS ENUM ('PENDING', 'SENT', 'ACCEPTED', 'EXPIRED', 'REVOKED');
CREATE TYPE "BetaTaskStatus" AS ENUM ('OPEN', 'COMPLETED');

CREATE TABLE "beta_invites" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "email_norm" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "invited_by_id" UUID NOT NULL,
    "user_id" UUID,
    "status" "BetaInviteStatus" NOT NULL DEFAULT 'PENDING',
    "personal_message" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "sent_at" TIMESTAMP(3),
    "accepted_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "beta_invites_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "beta_tester_tasks" (
    "id" UUID NOT NULL,
    "invite_id" UUID,
    "user_id" UUID,
    "assigned_by_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "BetaTaskStatus" NOT NULL DEFAULT 'OPEN',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "due_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "beta_tester_tasks_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "beta_invites_token_hash_key" ON "beta_invites"("token_hash");
CREATE INDEX "beta_invites_email_norm_idx" ON "beta_invites"("email_norm");
CREATE INDEX "beta_invites_status_idx" ON "beta_invites"("status");
CREATE INDEX "beta_invites_user_id_idx" ON "beta_invites"("user_id");
CREATE INDEX "beta_tester_tasks_user_id_status_idx" ON "beta_tester_tasks"("user_id", "status");
CREATE INDEX "beta_tester_tasks_invite_id_idx" ON "beta_tester_tasks"("invite_id");

ALTER TABLE "beta_invites" ADD CONSTRAINT "beta_invites_invited_by_id_fkey" FOREIGN KEY ("invited_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "beta_invites" ADD CONSTRAINT "beta_invites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "beta_tester_tasks" ADD CONSTRAINT "beta_tester_tasks_invite_id_fkey" FOREIGN KEY ("invite_id") REFERENCES "beta_invites"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "beta_tester_tasks" ADD CONSTRAINT "beta_tester_tasks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "beta_tester_tasks" ADD CONSTRAINT "beta_tester_tasks_assigned_by_id_fkey" FOREIGN KEY ("assigned_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
