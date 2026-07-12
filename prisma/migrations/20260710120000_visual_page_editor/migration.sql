-- Visueller Seiteneditor: Draft/Publish + Editable Pages

CREATE TYPE "PlatformTextStatus" AS ENUM ('standard', 'draft', 'published', 'archived');

ALTER TABLE "platform_texts" ADD COLUMN "draft_value" TEXT;
ALTER TABLE "platform_texts" ADD COLUMN "status" "PlatformTextStatus" NOT NULL DEFAULT 'published';
ALTER TABLE "platform_texts" ADD COLUMN "published_at" TIMESTAMP(3);
ALTER TABLE "platform_texts" ADD COLUMN "published_by" UUID;
ALTER TABLE "platform_texts" ADD COLUMN "page_path" TEXT;
ALTER TABLE "platform_texts" ADD COLUMN "content_type" TEXT NOT NULL DEFAULT 'text';
ALTER TABLE "platform_texts" ADD COLUMN "max_length" INTEGER;
ALTER TABLE "platform_texts" ADD COLUMN "allow_rich_text" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "platform_texts_page_path_idx" ON "platform_texts"("page_path");
CREATE INDEX "platform_texts_status_idx" ON "platform_texts"("status");

CREATE TABLE "editable_pages" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "editable_pages_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "editable_page_elements" (
    "id" UUID NOT NULL,
    "page_id" TEXT NOT NULL,
    "text_key" TEXT NOT NULL,
    "element_type" TEXT NOT NULL DEFAULT 'text',
    "label" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "editable_page_elements_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "page_content_releases" (
    "id" UUID NOT NULL,
    "page_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'published',
    "created_by" UUID,
    "published_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "published_at" TIMESTAMP(3),
    CONSTRAINT "page_content_releases_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "page_editor_sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "page_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "page_editor_sessions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "editable_page_elements_page_id_text_key_key" ON "editable_page_elements"("page_id", "text_key");
CREATE INDEX "editable_pages_category_idx" ON "editable_pages"("category");
CREATE INDEX "editable_pages_path_idx" ON "editable_pages"("path");
CREATE INDEX "editable_page_elements_page_id_idx" ON "editable_page_elements"("page_id");
CREATE INDEX "page_content_releases_page_id_idx" ON "page_content_releases"("page_id");
CREATE INDEX "page_editor_sessions_user_id_idx" ON "page_editor_sessions"("user_id");
CREATE INDEX "page_editor_sessions_expires_at_idx" ON "page_editor_sessions"("expires_at");

ALTER TABLE "editable_page_elements" ADD CONSTRAINT "editable_page_elements_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "editable_pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "editable_page_elements" ADD CONSTRAINT "editable_page_elements_text_key_fkey" FOREIGN KEY ("text_key") REFERENCES "platform_texts"("key") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "page_content_releases" ADD CONSTRAINT "page_content_releases_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "editable_pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "page_editor_sessions" ADD CONSTRAINT "page_editor_sessions_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "editable_pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
