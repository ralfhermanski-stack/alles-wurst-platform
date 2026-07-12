-- Kursdaten erweitern: Preis, formatierbare Texte, Startseiten-Hervorhebung

-- Kurzbeschreibung + zusätzliche formatierbare Textfelder
ALTER TABLE "courses" ADD COLUMN "short_description" TEXT;
ALTER TABLE "courses" ADD COLUMN "prerequisites" TEXT;
ALTER TABLE "courses" ADD COLUMN "required_equipment" TEXT;

-- Preis (in Cent; NULL = noch nicht gesetzt, 0 = bewusst kostenlos)
ALTER TABLE "courses" ADD COLUMN "price_cents" INTEGER;
ALTER TABLE "courses" ADD COLUMN "price_currency" TEXT NOT NULL DEFAULT 'EUR';

-- Startseiten-Logik
ALTER TABLE "courses" ADD COLUMN "featured_on_homepage" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "courses" ADD COLUMN "homepage_sort_order" INTEGER NOT NULL DEFAULT 100;

-- Indizes für Startseiten-Abfragen
CREATE INDEX "courses_featured_on_homepage_homepage_sort_order_idx" ON "courses"("featured_on_homepage", "homepage_sort_order");
CREATE INDEX "courses_created_at_idx" ON "courses"("created_at");
