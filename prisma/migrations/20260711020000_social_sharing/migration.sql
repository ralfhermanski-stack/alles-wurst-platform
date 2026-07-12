-- Social Sharing System

CREATE TYPE "RecipeSource" AS ENUM ('USER', 'ADMIN', 'PREMIUM_DATABASE');
CREATE TYPE "ShareContentType" AS ENUM ('CERTIFICATE', 'DIPLOMA', 'RECIPE');
CREATE TYPE "ShareStatus" AS ENUM ('ACTIVE', 'DISABLED', 'REVOKED', 'ADMIN_BLOCKED');

ALTER TABLE "recipes" ADD COLUMN "source" "RecipeSource" NOT NULL DEFAULT 'USER';
CREATE INDEX "recipes_source_idx" ON "recipes"("source");

UPDATE "recipes" SET "source" = 'PREMIUM_DATABASE' WHERE "is_official_database" = true;

CREATE TABLE "public_shares" (
    "id" UUID NOT NULL,
    "share_token" TEXT NOT NULL,
    "content_type" "ShareContentType" NOT NULL,
    "owner_user_id" UUID NOT NULL,
    "certificate_id" UUID,
    "recipe_id" UUID,
    "title" TEXT NOT NULL,
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "link_only" BOOLEAN NOT NULL DEFAULT false,
    "show_ingredients" BOOLEAN NOT NULL DEFAULT false,
    "show_instructions" BOOLEAN NOT NULL DEFAULT false,
    "status" "ShareStatus" NOT NULL DEFAULT 'ACTIVE',
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "whatsapp_shares" INTEGER NOT NULL DEFAULT 0,
    "facebook_shares" INTEGER NOT NULL DEFAULT 0,
    "linkedin_shares" INTEGER NOT NULL DEFAULT 0,
    "twitter_shares" INTEGER NOT NULL DEFAULT 0,
    "email_shares" INTEGER NOT NULL DEFAULT 0,
    "link_copies" INTEGER NOT NULL DEFAULT 0,
    "consent_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),
    "admin_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "public_shares_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "public_shares_share_token_key" ON "public_shares"("share_token");
CREATE UNIQUE INDEX "public_shares_certificate_id_key" ON "public_shares"("certificate_id");
CREATE UNIQUE INDEX "public_shares_recipe_id_owner_user_id_key" ON "public_shares"("recipe_id", "owner_user_id");
CREATE INDEX "public_shares_owner_user_id_status_idx" ON "public_shares"("owner_user_id", "status");
CREATE INDEX "public_shares_content_type_status_idx" ON "public_shares"("content_type", "status");
CREATE INDEX "public_shares_share_token_idx" ON "public_shares"("share_token");

ALTER TABLE "public_shares" ADD CONSTRAINT "public_shares_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public_shares" ADD CONSTRAINT "public_shares_certificate_id_fkey" FOREIGN KEY ("certificate_id") REFERENCES "user_course_certificates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public_shares" ADD CONSTRAINT "public_shares_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "share_security_logs" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "recipe_id" UUID,
    "share_id" UUID,
    "ip_address" TEXT,
    "action" TEXT NOT NULL,
    "details" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "share_security_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "share_security_logs_user_id_idx" ON "share_security_logs"("user_id");
CREATE INDEX "share_security_logs_recipe_id_idx" ON "share_security_logs"("recipe_id");
CREATE INDEX "share_security_logs_created_at_idx" ON "share_security_logs"("created_at");
