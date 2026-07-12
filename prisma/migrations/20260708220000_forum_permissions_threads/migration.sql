-- Forum-Rechte, Mitgliedschaftsforen, Threads und Beiträge

ALTER TYPE "ForumType" ADD VALUE IF NOT EXISTS 'membership';

CREATE TYPE "ForumReadAccess" AS ENUM (
  'public',
  'registered',
  'course_access',
  'membership',
  'mini_course_access'
);

ALTER TABLE "forums"
  ADD COLUMN IF NOT EXISTS "read_access" "ForumReadAccess" NOT NULL DEFAULT 'registered',
  ADD COLUMN IF NOT EXISTS "write_enabled" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "required_membership_role" "MembershipRole";

UPDATE "forums" SET "read_access" = 'course_access' WHERE "forum_type" = 'course';
UPDATE "forums" SET "read_access" = 'mini_course_access' WHERE "forum_type" = 'mini_course_global';
UPDATE "forums" SET "read_access" = 'registered' WHERE "forum_type" = 'general';

CREATE TABLE IF NOT EXISTS "forum_threads" (
    "id" UUID NOT NULL,
    "forum_id" UUID NOT NULL,
    "author_user_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "is_locked" BOOLEAN NOT NULL DEFAULT false,
    "display_name_snapshot" TEXT,
    "avatar_url_snapshot" TEXT,
    "author_role_badge" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "forum_threads_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "forum_posts" (
    "id" UUID NOT NULL,
    "thread_id" UUID NOT NULL,
    "author_user_id" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "display_name_snapshot" TEXT,
    "avatar_url_snapshot" TEXT,
    "author_role_badge" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "forum_posts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "forum_threads_forum_id_slug_key" ON "forum_threads"("forum_id", "slug");
CREATE INDEX IF NOT EXISTS "forum_threads_forum_id_created_at_idx" ON "forum_threads"("forum_id", "created_at");
CREATE INDEX IF NOT EXISTS "forum_posts_thread_id_created_at_idx" ON "forum_posts"("thread_id", "created_at");

ALTER TABLE "forum_threads" ADD CONSTRAINT "forum_threads_forum_id_fkey" FOREIGN KEY ("forum_id") REFERENCES "forums"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "forum_threads" ADD CONSTRAINT "forum_threads_author_user_id_fkey" FOREIGN KEY ("author_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "forum_posts" ADD CONSTRAINT "forum_posts_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "forum_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "forum_posts" ADD CONSTRAINT "forum_posts_author_user_id_fkey" FOREIGN KEY ("author_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
