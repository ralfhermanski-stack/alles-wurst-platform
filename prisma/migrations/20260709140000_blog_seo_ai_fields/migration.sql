-- SEO & KI-Felder für Blogartikel

ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "og_title" TEXT;
ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "og_description" TEXT;
ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "twitter_title" TEXT;
ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "twitter_description" TEXT;
ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "seo_keywords" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "seo_tags_suggested" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "schema_json" JSONB;
ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "internal_link_suggestions" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "seo_score" INTEGER;
ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "readability_score" INTEGER;
ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "last_seo_analysis_at" TIMESTAMP(3);
ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "seo_analysis_draft" JSONB;
