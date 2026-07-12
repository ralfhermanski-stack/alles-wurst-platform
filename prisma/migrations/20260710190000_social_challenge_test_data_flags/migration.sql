-- AlterTable
ALTER TABLE "social_media_channels" ADD COLUMN "is_test_data" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "social_media_posts" ADD COLUMN "is_test_data" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "community_challenges" ADD COLUMN "is_test_data" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "challenge_submissions" ADD COLUMN "is_test_data" BOOLEAN NOT NULL DEFAULT false;
