-- CreateEnum
CREATE TYPE "RecipeModerationStatus" AS ENUM ('none', 'pending', 'approved', 'rejected', 'blocked');

-- AlterTable recipes — Moderation & offizielle Datenbank
ALTER TABLE "recipes" ADD COLUMN "moderation_status" "RecipeModerationStatus" NOT NULL DEFAULT 'none';
ALTER TABLE "recipes" ADD COLUMN "admin_comment" TEXT;
ALTER TABLE "recipes" ADD COLUMN "moderation_reviewed_at" TIMESTAMP(3);
ALTER TABLE "recipes" ADD COLUMN "is_official_database" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "recipes" ADD COLUMN "blocked_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "recipes_moderation_status_idx" ON "recipes"("moderation_status");

-- CreateTable recipe_categories
CREATE TABLE "recipe_categories" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recipe_categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "recipe_categories_name_key" ON "recipe_categories"("name");
CREATE UNIQUE INDEX "recipe_categories_slug_key" ON "recipe_categories"("slug");

-- CreateTable recipe_generator_settings (Singleton)
CREATE TABLE "recipe_generator_settings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "pdf_header_text" TEXT NOT NULL DEFAULT 'Alles-Wurst Rezeptgenerator',
    "pdf_footer_text" TEXT NOT NULL DEFAULT 'Erstellt mit dem Alles-Wurst Rezeptgenerator',
    "pdf_logo_placeholder" TEXT NOT NULL DEFAULT 'Logo',
    "pdf_legal_notice" TEXT NOT NULL DEFAULT '',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recipe_generator_settings_pkey" PRIMARY KEY ("id")
);

-- Seed: Standard-Kategorien
INSERT INTO "recipe_categories" ("id", "name", "slug", "description", "sort_order", "active", "created_at", "updated_at")
VALUES
  (gen_random_uuid(), 'Brühwurst', 'bruehwurst', 'Brühwürste und ähnliche Erzeugnisse', 10, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Rohwurst', 'rohwurst', 'Rohwürste und Rohpökelware', 20, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Kochwurst', 'kochwurst', 'Kochwürste und Mortadella', 30, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Bratwurst', 'bratwurst', 'Bratwürste und Grillwürste', 40, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Spezialität', 'spezialitaet', 'Spezialrezepte und Sonstiges', 50, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Seed: PDF-Einstellungen (Singleton)
INSERT INTO "recipe_generator_settings" ("id", "pdf_header_text", "pdf_footer_text", "pdf_logo_placeholder", "pdf_legal_notice", "updated_at")
VALUES ('default', 'Alles-Wurst Rezeptgenerator', 'Erstellt mit dem Alles-Wurst Rezeptgenerator', 'Logo', '', CURRENT_TIMESTAMP);
