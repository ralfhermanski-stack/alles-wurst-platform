-- SEO nur als Vorschläge bis Freigabe

ALTER TYPE "PageSeoGenerationStatus" ADD VALUE IF NOT EXISTS 'pending_review';

ALTER TABLE "page_seo" ADD COLUMN IF NOT EXISTS "seo_draft" JSONB;
