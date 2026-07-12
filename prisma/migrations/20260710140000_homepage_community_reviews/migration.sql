-- CreateEnum
CREATE TYPE "PlatformReviewFocus" AS ENUM ('platform', 'courses', 'recipes', 'tools', 'community', 'support');

-- CreateEnum
CREATE TYPE "PlatformReviewModerationStatus" AS ENUM ('pending', 'approved', 'rejected', 'archived');

-- CreateEnum
CREATE TYPE "MemberCountDisplayMode" AS ENUM ('exact', 'rounded', 'hidden');

-- CreateEnum
CREATE TYPE "HomepageReviewsEmptyMode" AS ENUM ('message', 'hidden');

-- CreateEnum
CREATE TYPE "PlatformReviewEligibilityRule" AS ENUM ('days_registered', 'course_started', 'recipe_saved', 'tool_used');

-- AlterTable
ALTER TABLE "course_reviews" ADD COLUMN "featured_on_homepage" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "course_reviews" ADD COLUMN "show_membership_snapshot" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "course_reviews" ADD COLUMN "membership_label_snapshot" TEXT;
ALTER TABLE "course_reviews" ADD COLUMN "course_title_snapshot" TEXT;
ALTER TABLE "course_reviews" ADD COLUMN "reviewed_at" TIMESTAMP(3);
ALTER TABLE "course_reviews" ADD COLUMN "reviewed_by_id" UUID;
ALTER TABLE "course_reviews" ADD COLUMN "rejection_reason" TEXT;
ALTER TABLE "course_reviews" ADD COLUMN "published_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "course_reviews_status_featured_on_homepage_idx" ON "course_reviews"("status", "featured_on_homepage");

-- CreateTable
CREATE TABLE "platform_reviews" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "rating" INTEGER NOT NULL,
    "title" VARCHAR(100),
    "content" TEXT NOT NULL,
    "focus" "PlatformReviewFocus" NOT NULL DEFAULT 'platform',
    "moderation_status" "PlatformReviewModerationStatus" NOT NULL DEFAULT 'pending',
    "public_consent" BOOLEAN NOT NULL DEFAULT false,
    "show_membership" BOOLEAN NOT NULL DEFAULT false,
    "featured_on_homepage" BOOLEAN NOT NULL DEFAULT false,
    "display_name_snapshot" TEXT,
    "avatar_url_snapshot" TEXT,
    "membership_label_snapshot" TEXT,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" TIMESTAMP(3),
    "reviewed_by_id" UUID,
    "rejection_reason" TEXT,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "homepage_community_reviews_settings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "member_count_display" "MemberCountDisplayMode" NOT NULL DEFAULT 'exact',
    "show_average_rating" BOOLEAN NOT NULL DEFAULT true,
    "min_reviews_for_average" INTEGER NOT NULL DEFAULT 5,
    "empty_state_mode" "HomepageReviewsEmptyMode" NOT NULL DEFAULT 'message',
    "eligibility_rule" "PlatformReviewEligibilityRule" NOT NULL DEFAULT 'days_registered',
    "min_registration_days" INTEGER NOT NULL DEFAULT 7,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "homepage_community_reviews_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "platform_reviews_user_id_key" ON "platform_reviews"("user_id");

-- CreateIndex
CREATE INDEX "platform_reviews_moderation_status_idx" ON "platform_reviews"("moderation_status");

-- CreateIndex
CREATE INDEX "platform_reviews_moderation_status_featured_on_homepage_idx" ON "platform_reviews"("moderation_status", "featured_on_homepage");

-- AddForeignKey
ALTER TABLE "platform_reviews" ADD CONSTRAINT "platform_reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_reviews" ADD CONSTRAINT "platform_reviews_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed default settings
INSERT INTO "homepage_community_reviews_settings" ("id", "updated_at")
VALUES ('default', CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
