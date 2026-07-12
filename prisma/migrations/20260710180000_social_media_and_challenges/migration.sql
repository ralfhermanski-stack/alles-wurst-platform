-- CreateEnum
CREATE TYPE "SocialMediaPlatform" AS ENUM ('TIKTOK', 'INSTAGRAM', 'FACEBOOK', 'YOUTUBE');

-- CreateEnum
CREATE TYPE "SocialMediaIntegrationMode" AS ENUM ('API', 'EMBED', 'MANUAL', 'DISABLED');

-- CreateEnum
CREATE TYPE "SocialMediaPostSource" AS ENUM ('API', 'MANUAL');

-- CreateEnum
CREATE TYPE "SocialMediaPostType" AS ENUM ('IMAGE', 'VIDEO', 'REEL', 'SHORT', 'POST', 'LIVE', 'CAROUSEL');

-- CreateEnum
CREATE TYPE "SocialMediaConnectionStatus" AS ENUM ('NOT_CONFIGURED', 'CONNECTED', 'TOKEN_EXPIRED', 'ERROR', 'DISABLED');

-- CreateEnum
CREATE TYPE "SocialMediaSyncStatus" AS ENUM ('RUNNING', 'SUCCESS', 'WARNING', 'FAILED');

-- CreateEnum
CREATE TYPE "SocialMediaTagSource" AS ENUM ('AUTO', 'MANUAL', 'MIXED');

-- CreateEnum
CREATE TYPE "CommunityChallengeStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'ACTIVE', 'VOTING', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ChallengeSubmissionStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'WITHDRAWN', 'WINNER');

-- CreateEnum
CREATE TYPE "ChallengeVotingMode" AS ENUM ('ADMIN_ONLY', 'JURY', 'COMMUNITY', 'MIXED');

-- CreateEnum
CREATE TYPE "ChallengePopupState" AS ENUM ('SEEN', 'REMIND_LATER', 'DISMISSED', 'PARTICIPATING', 'SUBMITTED');

-- CreateEnum
CREATE TYPE "ChallengeNotificationType" AS ENUM ('PUBLISHED', 'ENDS_IN_7_DAYS', 'ENDS_IN_2_DAYS', 'DRAFT_REMINDER', 'SUBMITTED', 'APPROVED', 'REJECTED', 'WINNER_ANNOUNCED');

-- CreateTable
CREATE TABLE "social_media_channels" (
    "id" UUID NOT NULL,
    "platform" "SocialMediaPlatform" NOT NULL,
    "name" TEXT NOT NULL,
    "public_name" TEXT,
    "handle" TEXT,
    "profile_url" TEXT,
    "external_channel_id" TEXT,
    "description" TEXT,
    "icon" TEXT,
    "cover_image_url" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "show_on_homepage" BOOLEAN NOT NULL DEFAULT true,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "integration_mode" "SocialMediaIntegrationMode" NOT NULL DEFAULT 'MANUAL',
    "connection_status" "SocialMediaConnectionStatus" NOT NULL DEFAULT 'NOT_CONFIGURED',
    "cta_label" TEXT,
    "cta_url" TEXT,
    "follower_count" INTEGER,
    "follower_count_updated_at" TIMESTAMP(3),
    "show_follower_count" BOOLEAN NOT NULL DEFAULT false,
    "channel_keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "tag_source" "SocialMediaTagSource" NOT NULL DEFAULT 'AUTO',
    "manual_tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "featured_post_id" UUID,
    "last_synced_at" TIMESTAMP(3),
    "last_error_at" TIMESTAMP(3),
    "last_error_message" TEXT,
    "sync_interval_minutes" INTEGER NOT NULL DEFAULT 120,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_media_channels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_media_credentials" (
    "id" UUID NOT NULL,
    "channel_id" UUID NOT NULL,
    "credential_type" TEXT NOT NULL,
    "encrypted_value" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_media_credentials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_media_posts" (
    "id" UUID NOT NULL,
    "channel_id" UUID NOT NULL,
    "external_id" TEXT,
    "source_type" "SocialMediaPostSource" NOT NULL DEFAULT 'MANUAL',
    "post_type" "SocialMediaPostType" NOT NULL DEFAULT 'POST',
    "title" TEXT,
    "content" TEXT,
    "thumbnail_url" TEXT,
    "local_thumbnail_url" TEXT,
    "media_url" TEXT,
    "permalink" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "published_at" TIMESTAMP(3),
    "imported_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "show_on_homepage" BOOLEAN NOT NULL DEFAULT false,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_manual_locked" BOOLEAN NOT NULL DEFAULT false,
    "is_unavailable" BOOLEAN NOT NULL DEFAULT false,
    "raw_metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_media_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_media_sync_logs" (
    "id" UUID NOT NULL,
    "channel_id" UUID,
    "platform" "SocialMediaPlatform",
    "status" "SocialMediaSyncStatus" NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMP(3),
    "found_count" INTEGER NOT NULL DEFAULT 0,
    "created_count" INTEGER NOT NULL DEFAULT 0,
    "updated_count" INTEGER NOT NULL DEFAULT 0,
    "skipped_count" INTEGER NOT NULL DEFAULT 0,
    "error_code" TEXT,
    "error_message" TEXT,
    "triggered_by" TEXT NOT NULL DEFAULT 'cron',
    "triggered_by_user_id" UUID,

    CONSTRAINT "social_media_sync_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_challenges" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT,
    "description" TEXT NOT NULL,
    "task" TEXT NOT NULL,
    "cover_image_url" TEXT,
    "start_at" TIMESTAMP(3) NOT NULL,
    "end_at" TIMESTAMP(3) NOT NULL,
    "submission_deadline" TIMESTAMP(3) NOT NULL,
    "voting_start_at" TIMESTAMP(3),
    "voting_end_at" TIMESTAMP(3),
    "status" "CommunityChallengeStatus" NOT NULL DEFAULT 'DRAFT',
    "eligibility_config" JSONB NOT NULL DEFAULT '{}',
    "participation_rules" TEXT,
    "submission_config" JSONB NOT NULL DEFAULT '{}',
    "voting_mode" "ChallengeVotingMode" NOT NULL DEFAULT 'ADMIN_ONLY',
    "winner_count" INTEGER NOT NULL DEFAULT 1,
    "prize_description" TEXT,
    "show_on_homepage" BOOLEAN NOT NULL DEFAULT true,
    "show_in_member_dashboard" BOOLEAN NOT NULL DEFAULT true,
    "popup_enabled" BOOLEAN NOT NULL DEFAULT false,
    "popup_start_at" TIMESTAMP(3),
    "popup_end_at" TIMESTAMP(3),
    "popup_remind_after_days" INTEGER NOT NULL DEFAULT 3,
    "notifications_enabled" BOOLEAN NOT NULL DEFAULT true,
    "forum_id" UUID,
    "forum_thread_id" UUID,
    "created_by_id" UUID,
    "published_by_id" UUID,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "community_challenges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "challenge_submissions" (
    "id" UUID NOT NULL,
    "challenge_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "recipe_content" TEXT,
    "video_url" TEXT,
    "status" "ChallengeSubmissionStatus" NOT NULL DEFAULT 'DRAFT',
    "public_consent" BOOLEAN NOT NULL DEFAULT false,
    "media_rights_consent" BOOLEAN NOT NULL DEFAULT false,
    "media_rights_consent_at" TIMESTAMP(3),
    "submitted_at" TIMESTAMP(3),
    "reviewed_at" TIMESTAMP(3),
    "reviewed_by_id" UUID,
    "rejection_reason" TEXT,
    "is_winner" BOOLEAN NOT NULL DEFAULT false,
    "winner_rank" INTEGER,
    "vote_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "challenge_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "challenge_submission_media" (
    "id" UUID NOT NULL,
    "submission_id" UUID NOT NULL,
    "storage_url" TEXT NOT NULL,
    "storage_key" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "media_type" TEXT NOT NULL DEFAULT 'image',
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "challenge_submission_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "challenge_votes" (
    "id" UUID NOT NULL,
    "challenge_id" UUID NOT NULL,
    "submission_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "challenge_votes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "challenge_user_states" (
    "id" UUID NOT NULL,
    "challenge_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "popup_state" "ChallengePopupState",
    "last_popup_at" TIMESTAMP(3),
    "first_seen_at" TIMESTAMP(3),
    "dismissed_at" TIMESTAMP(3),
    "reminder_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "challenge_user_states_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "challenge_notification_logs" (
    "id" UUID NOT NULL,
    "challenge_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "notification_type" "ChallengeNotificationType" NOT NULL,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "challenge_notification_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "social_media_channels_active_show_on_homepage_display_order_idx" ON "social_media_channels"("active", "show_on_homepage", "display_order");

-- CreateIndex
CREATE UNIQUE INDEX "social_media_channels_platform_external_channel_id_key" ON "social_media_channels"("platform", "external_channel_id");

-- CreateIndex
CREATE UNIQUE INDEX "social_media_credentials_channel_id_credential_type_key" ON "social_media_credentials"("channel_id", "credential_type");

-- CreateIndex
CREATE INDEX "social_media_posts_channel_id_active_show_on_homepage_idx" ON "social_media_posts"("channel_id", "active", "show_on_homepage");

-- CreateIndex
CREATE INDEX "social_media_posts_published_at_idx" ON "social_media_posts"("published_at");

-- CreateIndex
CREATE UNIQUE INDEX "social_media_posts_channel_id_external_id_key" ON "social_media_posts"("channel_id", "external_id");

-- CreateIndex
CREATE INDEX "social_media_sync_logs_started_at_idx" ON "social_media_sync_logs"("started_at");

-- CreateIndex
CREATE INDEX "social_media_sync_logs_platform_status_idx" ON "social_media_sync_logs"("platform", "status");

-- CreateIndex
CREATE UNIQUE INDEX "community_challenges_slug_key" ON "community_challenges"("slug");

-- CreateIndex
CREATE INDEX "community_challenges_status_start_at_idx" ON "community_challenges"("status", "start_at");

-- CreateIndex
CREATE INDEX "community_challenges_show_on_homepage_status_idx" ON "community_challenges"("show_on_homepage", "status");

-- CreateIndex
CREATE INDEX "challenge_submissions_challenge_id_status_idx" ON "challenge_submissions"("challenge_id", "status");

-- CreateIndex
CREATE INDEX "challenge_submissions_user_id_idx" ON "challenge_submissions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "challenge_submissions_challenge_id_user_id_key" ON "challenge_submissions"("challenge_id", "user_id");

-- CreateIndex
CREATE INDEX "challenge_submission_media_submission_id_idx" ON "challenge_submission_media"("submission_id");

-- CreateIndex
CREATE INDEX "challenge_votes_submission_id_idx" ON "challenge_votes"("submission_id");

-- CreateIndex
CREATE UNIQUE INDEX "challenge_votes_challenge_id_user_id_submission_id_key" ON "challenge_votes"("challenge_id", "user_id", "submission_id");

-- CreateIndex
CREATE UNIQUE INDEX "challenge_user_states_challenge_id_user_id_key" ON "challenge_user_states"("challenge_id", "user_id");

-- CreateIndex
CREATE INDEX "challenge_notification_logs_user_id_idx" ON "challenge_notification_logs"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "challenge_notification_logs_challenge_id_user_id_notification_type_key" ON "challenge_notification_logs"("challenge_id", "user_id", "notification_type");

-- AddForeignKey
ALTER TABLE "social_media_channels" ADD CONSTRAINT "social_media_channels_featured_post_id_fkey" FOREIGN KEY ("featured_post_id") REFERENCES "social_media_posts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_media_credentials" ADD CONSTRAINT "social_media_credentials_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "social_media_channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_media_posts" ADD CONSTRAINT "social_media_posts_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "social_media_channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_media_sync_logs" ADD CONSTRAINT "social_media_sync_logs_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "social_media_channels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_challenges" ADD CONSTRAINT "community_challenges_forum_id_fkey" FOREIGN KEY ("forum_id") REFERENCES "forums"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge_submissions" ADD CONSTRAINT "challenge_submissions_challenge_id_fkey" FOREIGN KEY ("challenge_id") REFERENCES "community_challenges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge_submissions" ADD CONSTRAINT "challenge_submissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge_submission_media" ADD CONSTRAINT "challenge_submission_media_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "challenge_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge_votes" ADD CONSTRAINT "challenge_votes_challenge_id_fkey" FOREIGN KEY ("challenge_id") REFERENCES "community_challenges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge_votes" ADD CONSTRAINT "challenge_votes_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "challenge_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge_votes" ADD CONSTRAINT "challenge_votes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge_user_states" ADD CONSTRAINT "challenge_user_states_challenge_id_fkey" FOREIGN KEY ("challenge_id") REFERENCES "community_challenges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge_user_states" ADD CONSTRAINT "challenge_user_states_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge_notification_logs" ADD CONSTRAINT "challenge_notification_logs_challenge_id_fkey" FOREIGN KEY ("challenge_id") REFERENCES "community_challenges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge_notification_logs" ADD CONSTRAINT "challenge_notification_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
