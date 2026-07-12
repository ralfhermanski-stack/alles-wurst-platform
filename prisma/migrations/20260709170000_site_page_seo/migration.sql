-- Site-weites automatisches SEO

CREATE TYPE "PageSeoSource" AS ENUM ('auto', 'manual');
CREATE TYPE "PageSeoPageType" AS ENUM ('static', 'course', 'product', 'course_group', 'course_subgroup', 'blog_category', 'blog_tag');
CREATE TYPE "PageSeoGenerationStatus" AS ENUM ('pending', 'queued', 'processing', 'completed', 'failed', 'skipped', 'stale');

CREATE TABLE "page_seo" (
    "id" TEXT NOT NULL,
    "route_key" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "page_type" "PageSeoPageType" NOT NULL,
    "entity_id" TEXT,
    "seo_source" "PageSeoSource" NOT NULL DEFAULT 'auto',
    "meta_title" TEXT,
    "meta_description" TEXT,
    "keywords" JSONB NOT NULL DEFAULT '[]',
    "og_title" TEXT,
    "og_description" TEXT,
    "og_image" TEXT,
    "twitter_title" TEXT,
    "twitter_description" TEXT,
    "canonical_url" TEXT,
    "json_ld" JSONB,
    "ai_summary" TEXT,
    "ai_main_topic" TEXT,
    "ai_entities" JSONB NOT NULL DEFAULT '[]',
    "ai_audience" TEXT,
    "ai_expertise" TEXT,
    "semantic_keywords" JSONB NOT NULL DEFAULT '[]',
    "content_hash" TEXT,
    "last_generated_at" TIMESTAMP(3),
    "last_content_change_at" TIMESTAMP(3),
    "generation_status" "PageSeoGenerationStatus" NOT NULL DEFAULT 'pending',
    "error_message" TEXT,
    "is_published" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "page_seo_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "page_seo_route_key_key" ON "page_seo"("route_key");
CREATE INDEX "page_seo_page_type_idx" ON "page_seo"("page_type");
CREATE INDEX "page_seo_generation_status_idx" ON "page_seo"("generation_status");
CREATE INDEX "page_seo_seo_source_idx" ON "page_seo"("seo_source");

CREATE TABLE "page_seo_settings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "auto_generate_enabled" BOOLEAN NOT NULL DEFAULT true,
    "auto_update_on_change" BOOLEAN NOT NULL DEFAULT true,
    "only_published_pages" BOOLEAN NOT NULL DEFAULT true,
    "max_api_calls_per_day" INTEGER NOT NULL DEFAULT 50,
    "api_calls_today" INTEGER NOT NULL DEFAULT 0,
    "api_calls_reset_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "page_seo_settings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "page_seo_queue_jobs" (
    "id" TEXT NOT NULL,
    "route_key" TEXT NOT NULL,
    "action" TEXT NOT NULL DEFAULT 'generate',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "max_attempts" INTEGER NOT NULL DEFAULT 3,
    "error_message" TEXT,
    "scheduled_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "page_seo_queue_jobs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "page_seo_queue_jobs_status_scheduled_at_idx" ON "page_seo_queue_jobs"("status", "scheduled_at");
CREATE INDEX "page_seo_queue_jobs_route_key_idx" ON "page_seo_queue_jobs"("route_key");

INSERT INTO "page_seo_settings" ("id", "updated_at")
VALUES ('default', CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
