-- Stripe-Schlüsselverwaltung: interne Notizen (ohne Keys zu speichern)

ALTER TABLE "stripe_settings" ADD COLUMN IF NOT EXISTS "key_storage_note_test" TEXT;
ALTER TABLE "stripe_settings" ADD COLUMN IF NOT EXISTS "key_storage_note_live" TEXT;
ALTER TABLE "stripe_settings" ADD COLUMN IF NOT EXISTS "key_rotated_at_test" TIMESTAMP(3);
ALTER TABLE "stripe_settings" ADD COLUMN IF NOT EXISTS "key_rotated_at_live" TIMESTAMP(3);
