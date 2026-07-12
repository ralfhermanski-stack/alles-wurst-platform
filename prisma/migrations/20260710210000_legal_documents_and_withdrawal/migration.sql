-- CreateEnum
CREATE TYPE "LegalDocumentType" AS ENUM ('IMPRINT', 'PRIVACY_POLICY', 'TERMS_AND_CONDITIONS', 'WITHDRAWAL_POLICY', 'WITHDRAWAL_FORM', 'COOKIE_POLICY', 'OPTIONAL_OTHER');
CREATE TYPE "LegalDocumentStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'OUTDATED', 'ERROR', 'ARCHIVED');
CREATE TYPE "LegalDocumentSourceType" AS ENUM ('API', 'HTML_FETCH', 'TEXT_FETCH', 'WEBHOOK', 'MANUAL_IMPORT', 'MANUAL_EDIT');
CREATE TYPE "LegalDocumentIntegrationMode" AS ENUM ('API_SYNC', 'HTML_SYNC', 'TEXT_SYNC', 'WEBHOOK', 'MANUAL', 'IFRAME_PREVIEW_ONLY');
CREATE TYPE "LegalDocumentContentFormat" AS ENUM ('HTML', 'MARKDOWN', 'PLAIN_TEXT');
CREATE TYPE "LegalDocumentVersionStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'ARCHIVED');
CREATE TYPE "LegalSyncStatus" AS ENUM ('RUNNING', 'SUCCESS', 'UNCHANGED', 'FAILED');
CREATE TYPE "LegalProductType" AS ENUM ('DIGITAL_CONTENT', 'DIGITAL_SERVICE', 'MEMBERSHIP', 'LIVE_SERVICE', 'MIXED_CONTRACT', 'FREE_CONTENT');
CREATE TYPE "CheckoutConsentType" AS ENUM ('TERMS', 'PRIVACY_ACKNOWLEDGEMENT', 'IMMEDIATE_ACCESS', 'WITHDRAWAL_LOSS_ACKNOWLEDGEMENT');
CREATE TYPE "CourseAccessMode" AS ENUM ('IMMEDIATE', 'DELAYED');
CREATE TYPE "WithdrawalRequestStatus" AS ENUM ('RECEIVED', 'UNDER_REVIEW', 'ADDITIONAL_INFORMATION_REQUIRED', 'ACCEPTED', 'PARTIALLY_ACCEPTED', 'REJECTED', 'REFUNDED', 'CLOSED');

-- AlterTable products
ALTER TABLE "products" ADD COLUMN "legal_product_type" "LegalProductType";
ALTER TABLE "products" ADD COLUMN "legal_config" JSONB NOT NULL DEFAULT '{}';

-- AlterTable course_access
ALTER TABLE "course_access" ADD COLUMN IF NOT EXISTS "pending_access_until" TIMESTAMP(3);

-- CreateTable legal_documents
CREATE TABLE "legal_documents" (
    "id" UUID NOT NULL,
    "type" "LegalDocumentType" NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'de',
    "source_type" "LegalDocumentSourceType" NOT NULL DEFAULT 'MANUAL_EDIT',
    "provider_name" TEXT,
    "external_document_id" TEXT,
    "external_url" TEXT,
    "integration_mode" "LegalDocumentIntegrationMode" NOT NULL DEFAULT 'MANUAL',
    "content_format" "LegalDocumentContentFormat" NOT NULL DEFAULT 'HTML',
    "current_published_version_id" UUID,
    "status" "LegalDocumentStatus" NOT NULL DEFAULT 'DRAFT',
    "auto_publish" BOOLEAN NOT NULL DEFAULT false,
    "allow_manual_editing" BOOLEAN NOT NULL DEFAULT true,
    "public_visible" BOOLEAN NOT NULL DEFAULT true,
    "seo_index" BOOLEAN NOT NULL DEFAULT true,
    "last_checked_at" TIMESTAMP(3),
    "last_successful_sync_at" TIMESTAMP(3),
    "last_error_at" TIMESTAMP(3),
    "last_error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "legal_documents_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "legal_document_versions" (
    "id" UUID NOT NULL,
    "document_id" UUID NOT NULL,
    "version_number" INTEGER NOT NULL,
    "external_version" TEXT,
    "content" TEXT NOT NULL,
    "sanitized_content" TEXT NOT NULL,
    "checksum" TEXT NOT NULL,
    "status" "LegalDocumentVersionStatus" NOT NULL DEFAULT 'DRAFT',
    "valid_from" TIMESTAMP(3),
    "valid_until" TIMESTAMP(3),
    "imported_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "imported_by_id" UUID,
    "published_at" TIMESTAMP(3),
    "published_by_id" UUID,
    "source_metadata" JSONB,
    "change_summary" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "legal_document_versions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "legal_document_sync_logs" (
    "id" UUID NOT NULL,
    "document_id" UUID,
    "status" "LegalSyncStatus" NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMP(3),
    "content_changed" BOOLEAN NOT NULL DEFAULT false,
    "previous_checksum" TEXT,
    "new_checksum" TEXT,
    "error_code" TEXT,
    "error_message" TEXT,
    "triggered_by" TEXT NOT NULL DEFAULT 'cron',
    "triggered_by_user_id" UUID,
    CONSTRAINT "legal_document_sync_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "legal_document_credentials" (
    "id" UUID NOT NULL,
    "document_id" UUID,
    "provider" TEXT NOT NULL,
    "credential_type" TEXT NOT NULL,
    "encrypted_value" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "legal_document_credentials_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "checkout_legal_consents" (
    "id" UUID NOT NULL,
    "checkout_intent_id" UUID NOT NULL,
    "consent_type" "CheckoutConsentType" NOT NULL,
    "accepted" BOOLEAN NOT NULL,
    "label_text" TEXT NOT NULL,
    "document_version_id" UUID,
    "document_checksum" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "checkout_legal_consents_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "purchase_legal_records" (
    "id" UUID NOT NULL,
    "checkout_intent_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "accounting_position_id" UUID,
    "terms_version_id" UUID,
    "privacy_version_id" UUID,
    "withdrawal_policy_version_id" UUID,
    "terms_checksum" TEXT,
    "privacy_checksum" TEXT,
    "withdrawal_policy_checksum" TEXT,
    "immediate_access_consented" BOOLEAN NOT NULL DEFAULT false,
    "withdrawal_loss_acknowledged" BOOLEAN NOT NULL DEFAULT false,
    "access_mode" "CourseAccessMode" NOT NULL DEFAULT 'DELAYED',
    "pending_access_until" TIMESTAMP(3),
    "consent_snapshot" JSONB NOT NULL DEFAULT '{}',
    "legal_product_type" "LegalProductType",
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "purchase_legal_records_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "withdrawal_requests" (
    "id" UUID NOT NULL,
    "withdrawal_number" TEXT NOT NULL,
    "user_id" UUID,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "order_reference" TEXT,
    "product_name" TEXT,
    "order_date" TIMESTAMP(3),
    "contract_date" TIMESTAMP(3),
    "message" TEXT,
    "status" "WithdrawalRequestStatus" NOT NULL DEFAULT 'RECEIVED',
    "assigned_to_id" UUID,
    "rejection_reason" TEXT,
    "legal_basis_reference" TEXT,
    "internal_notes" TEXT,
    "purchase_legal_record_id" UUID,
    "stripe_refund_id" TEXT,
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "withdrawal_requests_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "legal_documents_slug_key" ON "legal_documents"("slug");
CREATE UNIQUE INDEX "legal_documents_current_published_version_id_key" ON "legal_documents"("current_published_version_id");
CREATE INDEX "legal_documents_type_status_idx" ON "legal_documents"("type", "status");
CREATE INDEX "legal_documents_public_visible_status_idx" ON "legal_documents"("public_visible", "status");

CREATE UNIQUE INDEX "legal_document_versions_document_id_version_number_key" ON "legal_document_versions"("document_id", "version_number");
CREATE INDEX "legal_document_versions_document_id_status_idx" ON "legal_document_versions"("document_id", "status");

CREATE INDEX "legal_document_sync_logs_started_at_idx" ON "legal_document_sync_logs"("started_at");
CREATE INDEX "legal_document_sync_logs_document_id_idx" ON "legal_document_sync_logs"("document_id");

CREATE UNIQUE INDEX "legal_document_credentials_provider_credential_type_document_id_key" ON "legal_document_credentials"("provider", "credential_type", "document_id");

CREATE INDEX "checkout_legal_consents_checkout_intent_id_idx" ON "checkout_legal_consents"("checkout_intent_id");

CREATE UNIQUE INDEX "purchase_legal_records_checkout_intent_id_key" ON "purchase_legal_records"("checkout_intent_id");
CREATE INDEX "purchase_legal_records_user_id_idx" ON "purchase_legal_records"("user_id");

CREATE UNIQUE INDEX "withdrawal_requests_withdrawal_number_key" ON "withdrawal_requests"("withdrawal_number");
CREATE INDEX "withdrawal_requests_status_idx" ON "withdrawal_requests"("status");
CREATE INDEX "withdrawal_requests_email_idx" ON "withdrawal_requests"("email");
CREATE INDEX "withdrawal_requests_user_id_idx" ON "withdrawal_requests"("user_id");

ALTER TABLE "legal_documents" ADD CONSTRAINT "legal_documents_current_published_version_id_fkey" FOREIGN KEY ("current_published_version_id") REFERENCES "legal_document_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "legal_document_versions" ADD CONSTRAINT "legal_document_versions_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "legal_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "legal_document_versions" ADD CONSTRAINT "legal_document_versions_imported_by_id_fkey" FOREIGN KEY ("imported_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "legal_document_versions" ADD CONSTRAINT "legal_document_versions_published_by_id_fkey" FOREIGN KEY ("published_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "legal_document_sync_logs" ADD CONSTRAINT "legal_document_sync_logs_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "legal_documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "legal_document_credentials" ADD CONSTRAINT "legal_document_credentials_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "legal_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "checkout_legal_consents" ADD CONSTRAINT "checkout_legal_consents_checkout_intent_id_fkey" FOREIGN KEY ("checkout_intent_id") REFERENCES "checkout_intents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "purchase_legal_records" ADD CONSTRAINT "purchase_legal_records_checkout_intent_id_fkey" FOREIGN KEY ("checkout_intent_id") REFERENCES "checkout_intents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "withdrawal_requests" ADD CONSTRAINT "withdrawal_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "withdrawal_requests" ADD CONSTRAINT "withdrawal_requests_assigned_to_id_fkey" FOREIGN KEY ("assigned_to_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
