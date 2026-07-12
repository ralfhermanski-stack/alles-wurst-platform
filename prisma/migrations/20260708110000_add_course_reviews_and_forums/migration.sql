-- Schritt 31: Kursbewertungen und Foren

CREATE TYPE "CourseReviewStatus" AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE "ForumType" AS ENUM ('course', 'mini_course_global', 'general');
CREATE TYPE "ForumPurpose" AS ENUM ('introduction', 'qa', 'improvements', 'custom');

ALTER TABLE "courses" ADD COLUMN "forums_enabled" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "course_reviews" (
    "id" UUID NOT NULL,
    "course_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "rating" INTEGER NOT NULL,
    "review_text" TEXT,
    "status" "CourseReviewStatus" NOT NULL DEFAULT 'pending',
    "display_name_snapshot" TEXT,
    "avatar_url_snapshot" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_reviews_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "forums" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "forum_type" "ForumType" NOT NULL,
    "forum_purpose" "ForumPurpose" NOT NULL DEFAULT 'custom',
    "course_id" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "forums_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "system_settings" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("key")
);

CREATE UNIQUE INDEX "course_reviews_course_id_user_id_key" ON "course_reviews"("course_id", "user_id");
CREATE INDEX "course_reviews_course_id_status_idx" ON "course_reviews"("course_id", "status");
CREATE INDEX "course_reviews_status_idx" ON "course_reviews"("status");

CREATE UNIQUE INDEX "forums_slug_key" ON "forums"("slug");
CREATE UNIQUE INDEX "forums_course_id_forum_purpose_key" ON "forums"("course_id", "forum_purpose");
CREATE INDEX "forums_forum_type_idx" ON "forums"("forum_type");
CREATE INDEX "forums_course_id_idx" ON "forums"("course_id");
CREATE INDEX "forums_is_active_sort_order_idx" ON "forums"("is_active", "sort_order");

ALTER TABLE "course_reviews" ADD CONSTRAINT "course_reviews_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "course_reviews" ADD CONSTRAINT "course_reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "forums" ADD CONSTRAINT "forums_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "system_settings" ("key", "value", "updated_at")
VALUES ('mini_course_global_forums_enabled', 'false', CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO NOTHING;
