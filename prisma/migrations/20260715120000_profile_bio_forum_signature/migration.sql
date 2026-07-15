-- Profilbeschreibung optional als Foren-Signatur nutzen
ALTER TABLE "user_profiles"
ADD COLUMN "use_bio_as_forum_signature" BOOLEAN NOT NULL DEFAULT false;
