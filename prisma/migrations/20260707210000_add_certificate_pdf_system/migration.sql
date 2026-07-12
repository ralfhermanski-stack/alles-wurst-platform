-- AlterEnum
ALTER TYPE "UserCertificateStatus" ADD VALUE 'revoked';

-- AlterTable
ALTER TABLE "user_course_certificates" ADD COLUMN IF NOT EXISTS "verification_token" TEXT;
ALTER TABLE "user_course_certificates" ADD COLUMN IF NOT EXISTS "verification_url" TEXT;
ALTER TABLE "user_course_certificates" ADD COLUMN IF NOT EXISTS "pdf_generated_at" TIMESTAMP(3);

-- CreateIndex (unique certificate_number if not exists)
CREATE UNIQUE INDEX IF NOT EXISTS "user_course_certificates_certificate_number_key" ON "user_course_certificates"("certificate_number");
CREATE UNIQUE INDEX IF NOT EXISTS "user_course_certificates_verification_token_key" ON "user_course_certificates"("verification_token");
CREATE INDEX IF NOT EXISTS "user_course_certificates_certificate_number_idx" ON "user_course_certificates"("certificate_number");

-- CreateTable
CREATE TABLE IF NOT EXISTS "certificate_sequences" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "sequence_year" INTEGER NOT NULL,
    "current_number" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "certificate_sequences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "certificate_templates" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "background_storage_key" TEXT,
    "background_file_name" TEXT,
    "instructor_name" TEXT NOT NULL DEFAULT 'Ralf Hermanski',
    "instructor_title" TEXT NOT NULL DEFAULT 'Fleischermeister seit 1994',
    "placeholders" JSONB NOT NULL DEFAULT '[]',
    "qr_config" JSONB NOT NULL DEFAULT '{"x":82,"y":72,"size":12}',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "certificate_templates_pkey" PRIMARY KEY ("id")
);

INSERT INTO "certificate_sequences" ("id", "sequence_year", "current_number", "updated_at")
VALUES ('default', EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER, 0, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "certificate_templates" ("id", "instructor_name", "instructor_title", "placeholders", "qr_config", "updated_at")
VALUES (
    'default',
    'Ralf Hermanski',
    'Fleischermeister seit 1994',
    '[
      {"key":"COURSE_TITLE","x":10,"y":28,"width":80,"height":8,"textAlign":"center","fontSize":28,"fontWeight":700,"fontFamily":"Georgia, serif","color":"#1a1a1a","visible":true},
      {"key":"STUDENT_NAME","x":10,"y":42,"width":80,"height":10,"textAlign":"center","fontSize":36,"fontWeight":700,"fontFamily":"Georgia, serif","color":"#8B6914","visible":true},
      {"key":"CERTIFICATE_NUMBER","x":10,"y":58,"width":80,"height":5,"textAlign":"center","fontSize":14,"fontWeight":400,"fontFamily":"Arial, sans-serif","color":"#444444","visible":true},
      {"key":"ISSUED_DATE","x":10,"y":64,"width":80,"height":5,"textAlign":"center","fontSize":14,"fontWeight":400,"fontFamily":"Arial, sans-serif","color":"#444444","visible":true},
      {"key":"INSTRUCTOR_NAME","x":12,"y":78,"width":35,"height":5,"textAlign":"left","fontSize":16,"fontWeight":600,"fontFamily":"Arial, sans-serif","color":"#1a1a1a","visible":true},
      {"key":"INSTRUCTOR_TITLE","x":12,"y":83,"width":35,"height":5,"textAlign":"left","fontSize":12,"fontWeight":400,"fontFamily":"Arial, sans-serif","color":"#666666","visible":true},
      {"key":"VERIFICATION_URL","x":55,"y":88,"width":35,"height":4,"textAlign":"right","fontSize":9,"fontWeight":400,"fontFamily":"Arial, sans-serif","color":"#888888","visible":true}
    ]'::jsonb,
    '{"x":82,"y":72,"size":12}'::jsonb,
    CURRENT_TIMESTAMP
)
ON CONFLICT ("id") DO NOTHING;
