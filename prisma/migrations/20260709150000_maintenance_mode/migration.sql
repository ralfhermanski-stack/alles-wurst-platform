-- Wartungsmodus

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "maintenance_bypass" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS "maintenance_settings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "title" TEXT NOT NULL DEFAULT 'ALLES WURST',
    "text" TEXT NOT NULL DEFAULT '🔧 Wir arbeiten für euch an Verbesserungen

Aktuell überarbeiten wir unsere Plattform,
erstellen neue Inhalte und verbessern bestehende Funktionen.

Wir sind bald wieder für euch da.

Vielen Dank für eure Geduld.

Euer Alles-Wurst-Team',
    "show_logo" BOOLEAN NOT NULL DEFAULT true,
    "background_url" TEXT,
    "logo_url" TEXT,
    "countdown_enabled" BOOLEAN NOT NULL DEFAULT false,
    "end_date" TIMESTAMP(3),
    "http_status" TEXT NOT NULL DEFAULT '503',
    "newsletter_enabled" BOOLEAN NOT NULL DEFAULT true,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "maintenance_settings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "maintenance_newsletter_signups" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'maintenance',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "maintenance_newsletter_signups_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "maintenance_newsletter_signups_email_key"
    ON "maintenance_newsletter_signups"("email");

INSERT INTO "maintenance_settings" ("id", "enabled", "updated_at")
VALUES ('default', false, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
