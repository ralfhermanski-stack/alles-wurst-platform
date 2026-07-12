-- CreateEnum
CREATE TYPE "EmailProviderType" AS ENUM ('DEV', 'DISABLED', 'SMTP', 'RESEND', 'BREVO', 'POSTMARK', 'SES', 'MAILGUN', 'SENDGRID');
CREATE TYPE "EmailCategory" AS ENUM ('AUTH', 'ACCOUNT', 'SUPPORT', 'TICKET', 'COURSE', 'CERTIFICATE', 'ORDER', 'PAYMENT', 'BILLING', 'MEMBERSHIP', 'WITHDRAWAL', 'PRIVACY', 'CHALLENGE', 'COMMUNITY', 'MASTER_SUPPORT', 'NEWSLETTER', 'SECURITY', 'SYSTEM', 'ADMIN_MANUAL');
CREATE TYPE "EmailTemplateStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');
CREATE TYPE "EmailMessageStatus" AS ENUM ('PENDING', 'PROCESSING', 'SENT', 'DELIVERED', 'FAILED', 'RETRYING', 'BOUNCED', 'COMPLAINED', 'CANCELLED', 'SUPPRESSED');
CREATE TYPE "EmailPriority" AS ENUM ('CRITICAL', 'HIGH', 'NORMAL', 'LOW', 'BULK');
CREATE TYPE "EmailSuppressionReason" AS ENUM ('HARD_BOUNCE', 'SOFT_BOUNCE_LIMIT', 'COMPLAINT', 'MANUAL_BLOCK', 'INVALID_ADDRESS', 'PROVIDER_SUPPRESSION');
CREATE TYPE "EmailDeliveryEventType" AS ENUM ('DELIVERED', 'BOUNCED', 'COMPLAINED', 'REJECTED', 'DEFERRED', 'OPENED', 'CLICKED');

-- CreateTable
CREATE TABLE "email_provider_configs" (
    "id" UUID NOT NULL,
    "provider_type" "EmailProviderType" NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "encrypted_credentials" TEXT,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "last_tested_at" TIMESTAMP(3),
    "last_test_status" TEXT,
    "last_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "email_provider_configs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "email_sender_identities" (
    "id" UUID NOT NULL,
    "provider_config_id" UUID NOT NULL,
    "internal_name" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "email_address" TEXT NOT NULL,
    "reply_to_address" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "default_sender" BOOLEAN NOT NULL DEFAULT false,
    "allowed_categories" "EmailCategory"[] DEFAULT ARRAY[]::"EmailCategory"[],
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "dkim_status" TEXT,
    "spf_status" TEXT,
    "dmarc_status" TEXT,
    "last_tested_at" TIMESTAMP(3),
    "last_successful_send_at" TIMESTAMP(3),
    "last_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "email_sender_identities_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "email_templates" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "EmailCategory" NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'de',
    "status" "EmailTemplateStatus" NOT NULL DEFAULT 'DRAFT',
    "active_version_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "email_templates_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "email_template_versions" (
    "id" UUID NOT NULL,
    "template_id" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "subject" TEXT NOT NULL,
    "preheader" TEXT,
    "html_content" TEXT NOT NULL,
    "text_content" TEXT NOT NULL,
    "allowed_variables" JSONB NOT NULL DEFAULT '[]',
    "status" "EmailTemplateStatus" NOT NULL DEFAULT 'DRAFT',
    "created_by_id" UUID,
    "published_by_id" UUID,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "email_template_versions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "email_messages" (
    "id" UUID NOT NULL,
    "recipient_user_id" UUID,
    "recipient_email" TEXT NOT NULL,
    "recipient_masked" TEXT NOT NULL,
    "sender_identity_id" UUID,
    "provider_config_id" UUID,
    "template_version_id" UUID,
    "category" "EmailCategory" NOT NULL,
    "subject_snapshot" TEXT NOT NULL,
    "html_snapshot" TEXT,
    "text_snapshot" TEXT,
    "status" "EmailMessageStatus" NOT NULL DEFAULT 'PENDING',
    "priority" "EmailPriority" NOT NULL DEFAULT 'NORMAL',
    "scheduled_at" TIMESTAMP(3),
    "sent_at" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),
    "failed_at" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "next_retry_at" TIMESTAMP(3),
    "last_error_code" TEXT,
    "last_error_message" TEXT,
    "provider_message_id" TEXT,
    "related_entity_type" TEXT,
    "related_entity_id" TEXT,
    "requested_by_user_id" UUID,
    "is_test" BOOLEAN NOT NULL DEFAULT false,
    "has_attachments" BOOLEAN NOT NULL DEFAULT false,
    "create_account_message" BOOLEAN NOT NULL DEFAULT false,
    "account_message_type" TEXT,
    "account_message_title" TEXT,
    "account_message_body" TEXT,
    "account_message_link" TEXT,
    "processing_lock_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "email_messages_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "email_attachments" (
    "id" UUID NOT NULL,
    "email_message_id" UUID NOT NULL,
    "filename" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "storage_key" TEXT NOT NULL,
    "checksum" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "email_attachments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "email_delivery_events" (
    "id" UUID NOT NULL,
    "email_message_id" UUID NOT NULL,
    "provider_event_id" TEXT,
    "event_type" "EmailDeliveryEventType" NOT NULL,
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "email_delivery_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "email_suppressions" (
    "id" UUID NOT NULL,
    "email_hash" TEXT NOT NULL,
    "reason" "EmailSuppressionReason" NOT NULL,
    "source" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "released_at" TIMESTAMP(3),
    CONSTRAINT "email_suppressions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "email_preferences" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "category" "EmailCategory" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "source" TEXT NOT NULL DEFAULT 'user',
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "email_preferences_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "email_category_configs" (
    "id" UUID NOT NULL,
    "category" "EmailCategory" NOT NULL,
    "default_sender_id" UUID,
    "default_reply_to" TEXT,
    "default_priority" "EmailPriority" NOT NULL DEFAULT 'NORMAL',
    "transactional" BOOLEAN NOT NULL DEFAULT true,
    "marketing" BOOLEAN NOT NULL DEFAULT false,
    "attachments_allowed" BOOLEAN NOT NULL DEFAULT false,
    "also_account_message" BOOLEAN NOT NULL DEFAULT false,
    "manual_send_roles" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "email_category_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "email_provider_configs_active_provider_type_idx" ON "email_provider_configs"("active", "provider_type");
CREATE UNIQUE INDEX "email_sender_identities_email_address_key" ON "email_sender_identities"("email_address");
CREATE INDEX "email_sender_identities_active_verified_idx" ON "email_sender_identities"("active", "verified");
CREATE UNIQUE INDEX "email_templates_key_key" ON "email_templates"("key");
CREATE INDEX "email_templates_category_status_idx" ON "email_templates"("category", "status");
CREATE UNIQUE INDEX "email_templates_active_version_id_key" ON "email_templates"("active_version_id");
CREATE UNIQUE INDEX "email_template_versions_template_id_version_key" ON "email_template_versions"("template_id", "version");
CREATE INDEX "email_template_versions_template_id_status_idx" ON "email_template_versions"("template_id", "status");
CREATE INDEX "email_messages_status_priority_next_retry_at_idx" ON "email_messages"("status", "priority", "next_retry_at");
CREATE INDEX "email_messages_recipient_user_id_created_at_idx" ON "email_messages"("recipient_user_id", "created_at");
CREATE INDEX "email_messages_category_status_idx" ON "email_messages"("category", "status");
CREATE INDEX "email_messages_related_entity_type_related_entity_id_idx" ON "email_messages"("related_entity_type", "related_entity_id");
CREATE INDEX "email_attachments_email_message_id_idx" ON "email_attachments"("email_message_id");
CREATE INDEX "email_delivery_events_email_message_id_event_type_idx" ON "email_delivery_events"("email_message_id", "event_type");
CREATE UNIQUE INDEX "email_suppressions_email_hash_key" ON "email_suppressions"("email_hash");
CREATE INDEX "email_suppressions_active_idx" ON "email_suppressions"("active");
CREATE UNIQUE INDEX "email_preferences_user_id_category_key" ON "email_preferences"("user_id", "category");
CREATE INDEX "email_preferences_category_enabled_idx" ON "email_preferences"("category", "enabled");
CREATE UNIQUE INDEX "email_category_configs_category_key" ON "email_category_configs"("category");

-- AddForeignKey
ALTER TABLE "email_sender_identities" ADD CONSTRAINT "email_sender_identities_provider_config_id_fkey" FOREIGN KEY ("provider_config_id") REFERENCES "email_provider_configs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "email_template_versions" ADD CONSTRAINT "email_template_versions_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "email_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "email_template_versions" ADD CONSTRAINT "email_template_versions_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "email_template_versions" ADD CONSTRAINT "email_template_versions_published_by_id_fkey" FOREIGN KEY ("published_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "email_templates" ADD CONSTRAINT "email_templates_active_version_id_fkey" FOREIGN KEY ("active_version_id") REFERENCES "email_template_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "email_messages" ADD CONSTRAINT "email_messages_sender_identity_id_fkey" FOREIGN KEY ("sender_identity_id") REFERENCES "email_sender_identities"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "email_messages" ADD CONSTRAINT "email_messages_provider_config_id_fkey" FOREIGN KEY ("provider_config_id") REFERENCES "email_provider_configs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "email_messages" ADD CONSTRAINT "email_messages_template_version_id_fkey" FOREIGN KEY ("template_version_id") REFERENCES "email_template_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "email_messages" ADD CONSTRAINT "email_messages_requested_by_user_id_fkey" FOREIGN KEY ("requested_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "email_attachments" ADD CONSTRAINT "email_attachments_email_message_id_fkey" FOREIGN KEY ("email_message_id") REFERENCES "email_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "email_delivery_events" ADD CONSTRAINT "email_delivery_events_email_message_id_fkey" FOREIGN KEY ("email_message_id") REFERENCES "email_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "email_preferences" ADD CONSTRAINT "email_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
