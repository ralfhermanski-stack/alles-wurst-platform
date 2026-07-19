-- CreateTable
CREATE TABLE "forum_thread_watches" (
    "id" UUID NOT NULL,
    "thread_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "unread_count" INTEGER NOT NULL DEFAULT 0,
    "last_read_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "forum_thread_watches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "forum_thread_watches_user_id_unread_count_idx" ON "forum_thread_watches"("user_id", "unread_count");

-- CreateIndex
CREATE UNIQUE INDEX "forum_thread_watches_thread_id_user_id_key" ON "forum_thread_watches"("thread_id", "user_id");

-- AddForeignKey
ALTER TABLE "forum_thread_watches" ADD CONSTRAINT "forum_thread_watches_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "forum_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forum_thread_watches" ADD CONSTRAINT "forum_thread_watches_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: Thread-Autoren beobachten ihr Thema
INSERT INTO "forum_thread_watches" ("id", "thread_id", "user_id", "unread_count", "last_read_at", "created_at", "updated_at")
SELECT gen_random_uuid(), t."id", t."author_user_id", 0, t."updated_at", NOW(), NOW()
FROM "forum_threads" t
ON CONFLICT ("thread_id", "user_id") DO NOTHING;
