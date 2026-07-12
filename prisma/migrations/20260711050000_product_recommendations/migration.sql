-- Werkstatt: Produktempfehlungen & Partnerlinks

CREATE TYPE "ProductRecommendationStatus" AS ENUM ('draft', 'published', 'archived');
CREATE TYPE "PartnerProgramType" AS ENUM ('amazon', 'awin', 'digistore24', 'own_shop', 'external', 'course');
CREATE TYPE "ProductRecommendationClickType" AS ENUM ('view', 'amazon', 'shop', 'affiliate');

CREATE TABLE "partner_programs" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "program_type" "PartnerProgramType" NOT NULL,
    "affiliate_id" TEXT,
    "url_template" TEXT,
    "base_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 100,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "partner_programs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "partner_programs_slug_key" ON "partner_programs"("slug");
CREATE INDEX "partner_programs_is_active_idx" ON "partner_programs"("is_active");

CREATE TABLE "product_recommendation_settings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "affiliate_disclosure_text" TEXT NOT NULL DEFAULT 'Dieser Link kann ein Partnerlink sein. Für Sie entstehen keine zusätzlichen Kosten.',
    "default_amazon_program_id" UUID,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "product_recommendation_settings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "product_recommendation_categories" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 100,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "placeholder_image_storage_key" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "product_recommendation_categories_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "product_recommendation_categories_slug_key" ON "product_recommendation_categories"("slug");
CREATE INDEX "product_recommendation_categories_is_active_idx" ON "product_recommendation_categories"("is_active");
CREATE INDEX "product_recommendation_categories_sort_order_idx" ON "product_recommendation_categories"("sort_order");

CREATE TABLE "product_recommendations" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "short_description" VARCHAR(250) NOT NULL,
    "long_description" TEXT,
    "manufacturer" TEXT,
    "subcategory" TEXT,
    "category_id" UUID NOT NULL,
    "main_image_storage_key" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 100,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "status" "ProductRecommendationStatus" NOT NULL DEFAULT 'draft',
    "affiliate_link" TEXT,
    "amazon_link" TEXT,
    "shop_link" TEXT,
    "partner_program_id" UUID,
    "is_master_recommendation" BOOLEAN NOT NULL DEFAULT false,
    "master_recommendation_text" TEXT,
    "seo_title" TEXT,
    "seo_description" VARCHAR(320),
    "og_title" TEXT,
    "og_description" VARCHAR(320),
    "og_image_storage_key" TEXT,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "amazon_click_count" INTEGER NOT NULL DEFAULT 0,
    "shop_click_count" INTEGER NOT NULL DEFAULT 0,
    "affiliate_click_count" INTEGER NOT NULL DEFAULT 0,
    "published_at" TIMESTAMP(3),
    "archived_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "product_recommendations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "product_recommendations_slug_key" ON "product_recommendations"("slug");
CREATE INDEX "product_recommendations_status_idx" ON "product_recommendations"("status");
CREATE INDEX "product_recommendations_category_id_idx" ON "product_recommendations"("category_id");
CREATE INDEX "product_recommendations_sort_order_idx" ON "product_recommendations"("sort_order");
CREATE INDEX "product_recommendations_priority_idx" ON "product_recommendations"("priority");

ALTER TABLE "product_recommendations" ADD CONSTRAINT "product_recommendations_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "product_recommendation_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "product_recommendations" ADD CONSTRAINT "product_recommendations_partner_program_id_fkey" FOREIGN KEY ("partner_program_id") REFERENCES "partner_programs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "product_recommendation_gallery_images" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "storage_key" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 100,
    "caption" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "product_recommendation_gallery_images_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "product_recommendation_gallery_images_product_id_idx" ON "product_recommendation_gallery_images"("product_id");
ALTER TABLE "product_recommendation_gallery_images" ADD CONSTRAINT "product_recommendation_gallery_images_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product_recommendations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "product_recommendation_course_links" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "course_id" UUID NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 100,
    CONSTRAINT "product_recommendation_course_links_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "product_recommendation_course_links_product_id_course_id_key" ON "product_recommendation_course_links"("product_id", "course_id");
CREATE INDEX "product_recommendation_course_links_course_id_idx" ON "product_recommendation_course_links"("course_id");
ALTER TABLE "product_recommendation_course_links" ADD CONSTRAINT "product_recommendation_course_links_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product_recommendations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "product_recommendation_course_links" ADD CONSTRAINT "product_recommendation_course_links_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "product_recommendation_recipe_links" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "recipe_id" UUID NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 100,
    CONSTRAINT "product_recommendation_recipe_links_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "product_recommendation_recipe_links_product_id_recipe_id_key" ON "product_recommendation_recipe_links"("product_id", "recipe_id");
CREATE INDEX "product_recommendation_recipe_links_recipe_id_idx" ON "product_recommendation_recipe_links"("recipe_id");
ALTER TABLE "product_recommendation_recipe_links" ADD CONSTRAINT "product_recommendation_recipe_links_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product_recommendations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "product_recommendation_recipe_links" ADD CONSTRAINT "product_recommendation_recipe_links_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "product_recommendation_click_events" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "event_type" "ProductRecommendationClickType" NOT NULL,
    "user_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "product_recommendation_click_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "product_recommendation_click_events_product_id_idx" ON "product_recommendation_click_events"("product_id");
CREATE INDEX "product_recommendation_click_events_event_type_idx" ON "product_recommendation_click_events"("event_type");
CREATE INDEX "product_recommendation_click_events_created_at_idx" ON "product_recommendation_click_events"("created_at");
ALTER TABLE "product_recommendation_click_events" ADD CONSTRAINT "product_recommendation_click_events_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product_recommendations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "product_recommendation_click_events" ADD CONSTRAINT "product_recommendation_click_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
