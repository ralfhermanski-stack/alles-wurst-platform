-- Wartungsmodus: Bilder per Upload statt URL

ALTER TABLE "maintenance_settings" DROP COLUMN IF EXISTS "background_url";
ALTER TABLE "maintenance_settings" DROP COLUMN IF EXISTS "logo_url";
ALTER TABLE "maintenance_settings" ADD COLUMN IF NOT EXISTS "logo_storage_key" TEXT;
ALTER TABLE "maintenance_settings" ADD COLUMN IF NOT EXISTS "logo_file_name" TEXT;
ALTER TABLE "maintenance_settings" ADD COLUMN IF NOT EXISTS "logo_mime_type" TEXT;
ALTER TABLE "maintenance_settings" ADD COLUMN IF NOT EXISTS "background_storage_key" TEXT;
ALTER TABLE "maintenance_settings" ADD COLUMN IF NOT EXISTS "background_file_name" TEXT;
ALTER TABLE "maintenance_settings" ADD COLUMN IF NOT EXISTS "background_mime_type" TEXT;
