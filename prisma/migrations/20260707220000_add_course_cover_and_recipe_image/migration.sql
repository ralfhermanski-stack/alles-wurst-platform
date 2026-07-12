-- Kurs-Coverbild
ALTER TABLE "courses" ADD COLUMN "cover_storage_key" TEXT;
ALTER TABLE "courses" ADD COLUMN "cover_file_name" TEXT;

-- Rezeptbild
ALTER TABLE "recipes" ADD COLUMN "image_storage_key" TEXT;
ALTER TABLE "recipes" ADD COLUMN "image_file_name" TEXT;
