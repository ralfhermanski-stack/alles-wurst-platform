-- CreateEnum
CREATE TYPE "RecipeStatus" AS ENUM ('draft', 'saved', 'published');

-- CreateEnum
CREATE TYPE "RecipeVisibility" AS ENUM ('private', 'public', 'database');

-- CreateTable
CREATE TABLE "recipes" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "description" TEXT,
    "status" "RecipeStatus" NOT NULL DEFAULT 'draft',
    "visibility" "RecipeVisibility" NOT NULL DEFAULT 'private',
    "total_weight_kg" DECIMAL(10,3),
    "payload" JSONB NOT NULL DEFAULT '{}',
    "version" INTEGER NOT NULL DEFAULT 1,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "recipes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "recipes_user_id_idx" ON "recipes"("user_id");

-- CreateIndex
CREATE INDEX "recipes_visibility_idx" ON "recipes"("visibility");

-- CreateIndex
CREATE INDEX "recipes_category_idx" ON "recipes"("category");
