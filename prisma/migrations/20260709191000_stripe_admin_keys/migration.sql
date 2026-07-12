-- Stripe-Schlüssel verschlüsselt im Admin speichern

ALTER TABLE "stripe_settings" ADD COLUMN IF NOT EXISTS "encrypted_keys_test" TEXT;
ALTER TABLE "stripe_settings" ADD COLUMN IF NOT EXISTS "encrypted_keys_live" TEXT;
ALTER TABLE "stripe_settings" ADD COLUMN IF NOT EXISTS "keys_saved_at_test" TIMESTAMP(3);
ALTER TABLE "stripe_settings" ADD COLUMN IF NOT EXISTS "keys_saved_at_live" TIMESTAMP(3);
