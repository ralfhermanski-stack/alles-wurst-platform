-- Platform Text Management

CREATE TYPE "PlatformTextFormat" AS ENUM ('plain', 'markdown', 'html');

CREATE TABLE "platform_texts" (
    "key" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'de',
    "value" TEXT NOT NULL,
    "default_value" TEXT NOT NULL,
    "label" TEXT,
    "description" TEXT,
    "format" "PlatformTextFormat" NOT NULL DEFAULT 'plain',
    "version" INTEGER NOT NULL DEFAULT 1,
    "updated_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_texts_pkey" PRIMARY KEY ("key")
);

CREATE TABLE "platform_text_versions" (
    "id" UUID NOT NULL,
    "text_key" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "value" TEXT NOT NULL,
    "changed_by" UUID,
    "change_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_text_versions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "platform_text_change_logs" (
    "id" UUID NOT NULL,
    "text_key" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "old_value" TEXT,
    "new_value" TEXT,
    "user_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_text_change_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "platform_texts_category_idx" ON "platform_texts"("category");
CREATE INDEX "platform_texts_locale_idx" ON "platform_texts"("locale");
CREATE INDEX "platform_text_versions_text_key_idx" ON "platform_text_versions"("text_key");
CREATE UNIQUE INDEX "platform_text_versions_text_key_version_key" ON "platform_text_versions"("text_key", "version");
CREATE INDEX "platform_text_change_logs_text_key_idx" ON "platform_text_change_logs"("text_key");
CREATE INDEX "platform_text_change_logs_created_at_idx" ON "platform_text_change_logs"("created_at");

ALTER TABLE "platform_text_versions" ADD CONSTRAINT "platform_text_versions_text_key_fkey" FOREIGN KEY ("text_key") REFERENCES "platform_texts"("key") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "platform_text_change_logs" ADD CONSTRAINT "platform_text_change_logs_text_key_fkey" FOREIGN KEY ("text_key") REFERENCES "platform_texts"("key") ON DELETE CASCADE ON UPDATE CASCADE;
