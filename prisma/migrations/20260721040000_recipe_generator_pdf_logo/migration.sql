-- Rezeptgenerator: PDF-Logo per Upload statt nur Text-Platzhalter

ALTER TABLE "recipe_generator_settings" ADD COLUMN IF NOT EXISTS "pdf_logo_storage_key" TEXT;
ALTER TABLE "recipe_generator_settings" ADD COLUMN IF NOT EXISTS "pdf_logo_file_name" TEXT;
ALTER TABLE "recipe_generator_settings" ADD COLUMN IF NOT EXISTS "pdf_logo_mime_type" TEXT;
