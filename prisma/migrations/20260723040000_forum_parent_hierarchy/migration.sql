-- AlterTable
ALTER TABLE "forums" ADD COLUMN "parent_forum_id" UUID;

-- CreateIndex
CREATE INDEX "forums_parent_forum_id_idx" ON "forums"("parent_forum_id");

-- AddForeignKey
ALTER TABLE "forums" ADD CONSTRAINT "forums_parent_forum_id_fkey" FOREIGN KEY ("parent_forum_id") REFERENCES "forums"("id") ON DELETE SET NULL ON UPDATE CASCADE;
