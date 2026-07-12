-- Blog / Magazin für alles-wurst.de

CREATE TYPE "BlogPostStatus" AS ENUM ('draft', 'scheduled', 'published', 'archived');
CREATE TYPE "BlogSearchIntent" AS ENUM ('inform', 'learn', 'buy', 'compare', 'solve');

CREATE TABLE "blog_categories" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blog_categories_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "blog_categories_slug_key" ON "blog_categories"("slug");
CREATE INDEX "blog_categories_is_active_sort_order_idx" ON "blog_categories"("is_active", "sort_order");

CREATE TABLE "blog_tags" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blog_tags_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "blog_tags_slug_key" ON "blog_tags"("slug");

CREATE TABLE "blog_topic_clusters" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blog_topic_clusters_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "blog_topic_clusters_slug_key" ON "blog_topic_clusters"("slug");
CREATE INDEX "blog_topic_clusters_is_active_sort_order_idx" ON "blog_topic_clusters"("is_active", "sort_order");

CREATE TABLE "blog_posts" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT,
    "summary" TEXT,
    "body" TEXT NOT NULL DEFAULT '',
    "status" "BlogPostStatus" NOT NULL DEFAULT 'draft',
    "author_user_id" UUID NOT NULL,
    "category_id" UUID,
    "focus_keyword" TEXT,
    "secondary_keywords" JSONB NOT NULL DEFAULT '[]',
    "longtail_keywords" JSONB NOT NULL DEFAULT '[]',
    "keyword_notes" TEXT,
    "search_intent" "BlogSearchIntent",
    "questions_to_answer" JSONB NOT NULL DEFAULT '[]',
    "internal_link_notes" TEXT,
    "seo_title" TEXT,
    "meta_description" TEXT,
    "canonical_url" TEXT,
    "cover_storage_key" TEXT,
    "cover_file_name" TEXT,
    "cover_alt_text" TEXT,
    "cover_mime_type" TEXT,
    "faq_items" JSONB NOT NULL DEFAULT '[]',
    "definition_boxes" JSONB NOT NULL DEFAULT '[]',
    "internal_links" JSONB NOT NULL DEFAULT '[]',
    "related_post_ids" JSONB NOT NULL DEFAULT '[]',
    "linked_course_ids" JSONB NOT NULL DEFAULT '[]',
    "linked_recipe_ids" JSONB NOT NULL DEFAULT '[]',
    "cta_config" JSONB NOT NULL DEFAULT '{}',
    "reviewed_by_name" TEXT DEFAULT 'Ralf Hermanski, Fleischermeister',
    "expert_note" TEXT,
    "sources_note" TEXT,
    "disclaimer_note" TEXT DEFAULT 'Diese Inhalte dienen der allgemeinen Information und ersetzen keine individuelle Lebensmittelkontrolle oder Rechtsberatung.',
    "reading_time_minutes" INTEGER NOT NULL DEFAULT 0,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "robots_index" BOOLEAN NOT NULL DEFAULT true,
    "robots_follow" BOOLEAN NOT NULL DEFAULT true,
    "published_at" TIMESTAMP(3),
    "scheduled_at" TIMESTAMP(3),
    "content_updated_at" TIMESTAMP(3),
    "last_reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blog_posts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "blog_posts_slug_key" ON "blog_posts"("slug");
CREATE INDEX "blog_posts_status_published_at_idx" ON "blog_posts"("status", "published_at");
CREATE INDEX "blog_posts_category_id_idx" ON "blog_posts"("category_id");
CREATE INDEX "blog_posts_author_user_id_idx" ON "blog_posts"("author_user_id");
CREATE INDEX "blog_posts_scheduled_at_idx" ON "blog_posts"("scheduled_at");

CREATE TABLE "blog_post_tags" (
    "post_id" UUID NOT NULL,
    "tag_id" UUID NOT NULL,

    CONSTRAINT "blog_post_tags_pkey" PRIMARY KEY ("post_id","tag_id")
);

CREATE TABLE "blog_post_topics" (
    "post_id" UUID NOT NULL,
    "topic_id" UUID NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "blog_post_topics_pkey" PRIMARY KEY ("post_id","topic_id")
);

ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_author_user_id_fkey" FOREIGN KEY ("author_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "blog_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "blog_post_tags" ADD CONSTRAINT "blog_post_tags_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "blog_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "blog_post_tags" ADD CONSTRAINT "blog_post_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "blog_tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "blog_post_topics" ADD CONSTRAINT "blog_post_topics_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "blog_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "blog_post_topics" ADD CONSTRAINT "blog_post_topics_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "blog_topic_clusters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "blog_topic_clusters" ("id", "name", "slug", "description", "sort_order", "is_active", "created_at", "updated_at") VALUES
(gen_random_uuid(), 'Wurst selber machen', 'wurst-selber-machen', 'Grundlagen und Techniken für selbstgemachte Wurst', 10, true, NOW(), NOW()),
(gen_random_uuid(), 'Marinaden', 'marinaden', 'Marinieren, Würzen und Aromatisieren', 20, true, NOW(), NOW()),
(gen_random_uuid(), 'Räuchern', 'raeuchern', 'Räuchertechniken und Tipps', 30, true, NOW(), NOW()),
(gen_random_uuid(), 'Fleischkunde', 'fleischkunde', 'Fleischsorten, Schnitte und Qualität', 40, true, NOW(), NOW()),
(gen_random_uuid(), 'Hygiene', 'hygiene', 'Lebensmittelhygiene und Sicherheit', 50, true, NOW(), NOW()),
(gen_random_uuid(), 'Gewürze', 'gewuerze', 'Gewürzmischungen und Würztechnik', 60, true, NOW(), NOW()),
(gen_random_uuid(), 'Rezepte', 'rezepte', 'Rezepte und Inspiration', 70, true, NOW(), NOW()),
(gen_random_uuid(), 'Anfängerwissen', 'anfaengerwissen', 'Einstieg für Einsteiger', 80, true, NOW(), NOW()),
(gen_random_uuid(), 'Fehler vermeiden', 'fehler-vermeiden', 'Typische Fehler und Lösungen', 90, true, NOW(), NOW()),
(gen_random_uuid(), 'Ausrüstung', 'ausruestung', 'Werkzeug und Geräte', 100, true, NOW(), NOW()),
(gen_random_uuid(), 'Kurse', 'kurse', 'Verknüpfung zur Akademie', 110, true, NOW(), NOW()),
(gen_random_uuid(), 'Mitgliedschaft', 'mitgliedschaft', 'Club und Mitgliedschaft', 120, true, NOW(), NOW());
