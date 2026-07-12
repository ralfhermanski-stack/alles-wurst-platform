-- Öffentliche Profilfelder: Anzeigename, Avatar, Bio
ALTER TABLE "user_profiles" ADD COLUMN "public_name" TEXT;
ALTER TABLE "user_profiles" ADD COLUMN "avatar_url" TEXT;
ALTER TABLE "user_profiles" ADD COLUMN "bio" TEXT;

CREATE UNIQUE INDEX "user_profiles_public_name_key" ON "user_profiles"("public_name");
