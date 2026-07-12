-- Account orders, privacy center, order legal documents

CREATE TYPE "WithdrawalRequestSource" AS ENUM ('PUBLIC_FORM', 'USER_ACCOUNT');
CREATE TYPE "OrderLegalDocumentType" AS ENUM ('TERMS_AND_CONDITIONS', 'WITHDRAWAL_POLICY', 'WITHDRAWAL_FORM', 'ORDER_CONFIRMATION', 'MEMBERSHIP_TERMS', 'PRODUCT_SPECIFIC');
CREATE TYPE "OrderLegalDocumentStatus" AS ENUM ('PENDING', 'GENERATED', 'FAILED', 'SENT');
CREATE TYPE "PrivacyRequestType" AS ENUM ('ACCESS', 'RECTIFICATION', 'DELETION', 'RESTRICTION', 'OBJECTION', 'PORTABILITY', 'EXPORT');
CREATE TYPE "PrivacyRequestStatus" AS ENUM ('REQUESTED', 'EMAIL_CONFIRMATION_PENDING', 'CONFIRMED', 'IDENTITY_REVIEW', 'UNDER_REVIEW', 'PARTIALLY_FULFILLED', 'FULFILLED', 'REJECTED', 'CANCELLED');
CREATE TYPE "AccountDeletionPlanStatus" AS ENUM ('DRAFT', 'CONFIRMED', 'BLOCKED', 'EXECUTING', 'PARTIALLY_COMPLETED', 'COMPLETED', 'FAILED');
CREATE TYPE "DataExportRequestStatus" AS ENUM ('REQUESTED', 'PROCESSING', 'READY', 'DOWNLOADED', 'EXPIRED', 'FAILED');

ALTER TABLE "withdrawal_requests" ADD COLUMN "accounting_position_id" UUID;
ALTER TABLE "withdrawal_requests" ADD COLUMN "checkout_intent_id" UUID;
ALTER TABLE "withdrawal_requests" ADD COLUMN "source" "WithdrawalRequestSource" NOT NULL DEFAULT 'PUBLIC_FORM';
ALTER TABLE "withdrawal_requests" ADD COLUMN "declaration_text" TEXT;
ALTER TABLE "withdrawal_requests" ADD COLUMN "course_access_status" TEXT;
ALTER TABLE "withdrawal_requests" ADD COLUMN "consent_snapshot" JSONB;
ALTER TABLE "withdrawal_requests" ADD COLUMN "ticket_creation_failed" BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX "withdrawal_requests_accounting_position_id_idx" ON "withdrawal_requests"("accounting_position_id");

ALTER TABLE "support_tickets" ADD COLUMN "withdrawal_request_id" UUID;
ALTER TABLE "support_tickets" ADD COLUMN "privacy_request_id" UUID;
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_withdrawal_request_id_key" UNIQUE ("withdrawal_request_id");
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_privacy_request_id_key" UNIQUE ("privacy_request_id");
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_withdrawal_request_id_fkey" FOREIGN KEY ("withdrawal_request_id") REFERENCES "withdrawal_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "order_legal_documents" (
    "id" UUID NOT NULL,
    "accounting_position_id" UUID NOT NULL,
    "checkout_intent_id" UUID,
    "purchase_legal_record_id" UUID,
    "legal_document_type" "OrderLegalDocumentType" NOT NULL,
    "source_document_id" UUID,
    "source_version_id" UUID,
    "title" TEXT NOT NULL,
    "version_label" TEXT,
    "checksum" TEXT NOT NULL,
    "storage_key" TEXT,
    "mime_type" TEXT NOT NULL DEFAULT 'application/pdf',
    "size_bytes" INTEGER,
    "status" "OrderLegalDocumentStatus" NOT NULL DEFAULT 'PENDING',
    "error_message" TEXT,
    "generated_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "order_legal_documents_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "order_legal_documents_accounting_position_id_legal_document_type_key" ON "order_legal_documents"("accounting_position_id", "legal_document_type");
CREATE INDEX "order_legal_documents_checkout_intent_id_idx" ON "order_legal_documents"("checkout_intent_id");
ALTER TABLE "order_legal_documents" ADD CONSTRAINT "order_legal_documents_purchase_legal_record_id_fkey" FOREIGN KEY ("purchase_legal_record_id") REFERENCES "purchase_legal_records"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "user_account_messages" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "message_type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "link_url" TEXT,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_account_messages_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "user_account_messages_user_id_read_at_idx" ON "user_account_messages"("user_id", "read_at");
ALTER TABLE "user_account_messages" ADD CONSTRAINT "user_account_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "privacy_requests" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "request_number" TEXT NOT NULL,
    "type" "PrivacyRequestType" NOT NULL,
    "status" "PrivacyRequestStatus" NOT NULL DEFAULT 'REQUESTED',
    "user_message" TEXT,
    "response_text" TEXT,
    "rejection_reason" TEXT,
    "internal_notes" TEXT,
    "email_confirmation_token_hash" TEXT,
    "email_confirmation_expires_at" TIMESTAMP(3),
    "email_confirmed_at" TIMESTAMP(3),
    "final_confirmed_at" TIMESTAMP(3),
    "assigned_to_id" UUID,
    "due_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "privacy_requests_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "privacy_requests_request_number_key" ON "privacy_requests"("request_number");
CREATE INDEX "privacy_requests_user_id_status_idx" ON "privacy_requests"("user_id", "status");
CREATE INDEX "privacy_requests_status_due_at_idx" ON "privacy_requests"("status", "due_at");
ALTER TABLE "privacy_requests" ADD CONSTRAINT "privacy_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "privacy_requests" ADD CONSTRAINT "privacy_requests_assigned_to_id_fkey" FOREIGN KEY ("assigned_to_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_privacy_request_id_fkey" FOREIGN KEY ("privacy_request_id") REFERENCES "privacy_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "account_deletion_plans" (
    "id" UUID NOT NULL,
    "privacy_request_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "status" "AccountDeletionPlanStatus" NOT NULL DEFAULT 'DRAFT',
    "deletable_data" JSONB NOT NULL DEFAULT '[]',
    "anonymizable_data" JSONB NOT NULL DEFAULT '[]',
    "retained_data" JSONB NOT NULL DEFAULT '[]',
    "blocking_items" JSONB NOT NULL DEFAULT '[]',
    "retention_schedule" JSONB NOT NULL DEFAULT '[]',
    "calculated_at" TIMESTAMP(3),
    "executed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "account_deletion_plans_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "account_deletion_plans_privacy_request_id_key" ON "account_deletion_plans"("privacy_request_id");
CREATE INDEX "account_deletion_plans_user_id_status_idx" ON "account_deletion_plans"("user_id", "status");
ALTER TABLE "account_deletion_plans" ADD CONSTRAINT "account_deletion_plans_privacy_request_id_fkey" FOREIGN KEY ("privacy_request_id") REFERENCES "privacy_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "account_deletion_plans" ADD CONSTRAINT "account_deletion_plans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "account_data_retentions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "data_category" TEXT NOT NULL,
    "reason_code" TEXT NOT NULL,
    "legal_reference" TEXT,
    "retention_until" TIMESTAMP(3),
    "restricted_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "account_data_retentions_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "account_data_retentions_user_id_data_category_idx" ON "account_data_retentions"("user_id", "data_category");
CREATE INDEX "account_data_retentions_retention_until_idx" ON "account_data_retentions"("retention_until");
ALTER TABLE "account_data_retentions" ADD CONSTRAINT "account_data_retentions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "data_export_requests" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "status" "DataExportRequestStatus" NOT NULL DEFAULT 'REQUESTED',
    "storage_key" TEXT,
    "expires_at" TIMESTAMP(3),
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "generated_at" TIMESTAMP(3),
    "downloaded_at" TIMESTAMP(3),
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "data_export_requests_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "data_export_requests_user_id_status_idx" ON "data_export_requests"("user_id", "status");
ALTER TABLE "data_export_requests" ADD CONSTRAINT "data_export_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "support_ticket_categories" ("id", "slug", "name", "description", "sort_order", "is_active", "is_master_support", "created_at", "updated_at")
SELECT gen_random_uuid(), 'widerruf', 'Widerruf', 'Widerrufsanfragen aus dem Benutzerkonto', 90, true, false, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "support_ticket_categories" WHERE "slug" = 'widerruf');

INSERT INTO "support_ticket_categories" ("id", "slug", "name", "description", "sort_order", "is_active", "is_master_support", "created_at", "updated_at")
SELECT gen_random_uuid(), 'datenschutz-loeschung', 'Datenschutz / Löschung', 'Datenschutz- und Löschanfragen', 91, true, false, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "support_ticket_categories" WHERE "slug" = 'datenschutz-loeschung');
