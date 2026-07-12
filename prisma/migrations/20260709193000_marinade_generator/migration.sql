-- Marinaden-Generator: recipeKind + PDF-Felder

CREATE TYPE "RecipeKind" AS ENUM ('wurst', 'marinade');
CREATE TYPE "RecipePdfStatus" AS ENUM ('none', 'current', 'outdated');

ALTER TABLE "recipes" ADD COLUMN "recipe_kind" "RecipeKind" NOT NULL DEFAULT 'wurst';
ALTER TABLE "recipes" ADD COLUMN "pdf_storage_key" TEXT;
ALTER TABLE "recipes" ADD COLUMN "pdf_generated_at" TIMESTAMP(3);
ALTER TABLE "recipes" ADD COLUMN "pdf_version" INTEGER;
ALTER TABLE "recipes" ADD COLUMN "pdf_status" "RecipePdfStatus" NOT NULL DEFAULT 'none';

CREATE INDEX "recipes_recipe_kind_idx" ON "recipes"("recipe_kind");
