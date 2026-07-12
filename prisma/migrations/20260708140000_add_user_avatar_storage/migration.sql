-- Speicherfelder für hochgeladene Profilbilder
ALTER TABLE "user_profiles" ADD COLUMN "avatar_storage_key" TEXT;
ALTER TABLE "user_profiles" ADD COLUMN "avatar_file_name" TEXT;
