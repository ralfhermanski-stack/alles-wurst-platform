-- CertificateTemplate: Format + freie Textfelder
ALTER TABLE "certificate_templates" ADD COLUMN "format" TEXT NOT NULL DEFAULT 'landscape';
ALTER TABLE "certificate_templates" ADD COLUMN "text_fields" JSONB NOT NULL DEFAULT '[]';

-- Course: Admin-Override, damit ein Minikurs bewusst ein Zertifikat ausstellen darf
ALTER TABLE "courses" ADD COLUMN "certificate_override" BOOLEAN NOT NULL DEFAULT false;

-- Bestehende Singleton-Vorlage ("default") wird zur Zertifikatsvorlage (Querformat)
UPDATE "certificate_templates"
SET "id" = 'certificate', "format" = 'landscape'
WHERE "id" = 'default';

-- Sicherstellen, dass die Zertifikatsvorlage existiert (Querformat)
INSERT INTO "certificate_templates"
  ("id", "format", "instructor_name", "instructor_title", "placeholders", "qr_config", "text_fields", "updated_at")
SELECT 'certificate', 'landscape', 'Ralf Hermanski', 'Fleischermeister seit 1994',
       '[]'::jsonb, '{"x":82,"y":72,"size":12}'::jsonb, '[]'::jsonb, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "certificate_templates" WHERE "id" = 'certificate');

-- Teilnahmeurkunde-Vorlage anlegen (Hochformat)
INSERT INTO "certificate_templates"
  ("id", "format", "instructor_name", "instructor_title", "placeholders", "qr_config", "text_fields", "updated_at")
SELECT 'participation', 'portrait', 'Ralf Hermanski', 'Fleischermeister seit 1994',
       '[]'::jsonb, '{"x":44,"y":80,"size":16}'::jsonb, '[]'::jsonb, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "certificate_templates" WHERE "id" = 'participation');
