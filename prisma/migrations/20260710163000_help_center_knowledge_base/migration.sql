-- AlterTable
ALTER TABLE "support_ticket_categories" ADD COLUMN "is_master_support" BOOLEAN NOT NULL DEFAULT false;

-- CreateEnum
CREATE TYPE "KnowledgeBaseArticleStatus" AS ENUM ('draft', 'published', 'archived');

-- CreateEnum
CREATE TYPE "KnowledgeBaseVisibility" AS ENUM ('public', 'members');

-- CreateTable
CREATE TABLE "knowledge_base_categories" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "knowledge_base_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_base_articles" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "content" TEXT NOT NULL,
    "category_id" UUID NOT NULL,
    "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "KnowledgeBaseArticleStatus" NOT NULL DEFAULT 'draft',
    "visibility" "KnowledgeBaseVisibility" NOT NULL DEFAULT 'public',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "knowledge_base_articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_base_search_logs" (
    "id" UUID NOT NULL,
    "query" TEXT NOT NULL,
    "result_count" INTEGER NOT NULL,
    "had_results" BOOLEAN NOT NULL,
    "user_id" UUID,
    "source_page" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "knowledge_base_search_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "knowledge_base_categories_slug_key" ON "knowledge_base_categories"("slug");

-- CreateIndex
CREATE INDEX "knowledge_base_categories_is_active_sort_order_idx" ON "knowledge_base_categories"("is_active", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "knowledge_base_articles_slug_key" ON "knowledge_base_articles"("slug");

-- CreateIndex
CREATE INDEX "knowledge_base_articles_status_sort_order_idx" ON "knowledge_base_articles"("status", "sort_order");

-- CreateIndex
CREATE INDEX "knowledge_base_articles_category_id_status_idx" ON "knowledge_base_articles"("category_id", "status");

-- CreateIndex
CREATE INDEX "knowledge_base_search_logs_created_at_idx" ON "knowledge_base_search_logs"("created_at");

-- CreateIndex
CREATE INDEX "knowledge_base_search_logs_query_idx" ON "knowledge_base_search_logs"("query");

-- AddForeignKey
ALTER TABLE "knowledge_base_articles" ADD CONSTRAINT "knowledge_base_articles_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "knowledge_base_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
