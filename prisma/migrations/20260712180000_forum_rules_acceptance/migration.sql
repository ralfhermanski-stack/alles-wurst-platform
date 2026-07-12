-- Forenregeln als Rechtstext + vierteljährliche Nutzer-Akzeptanz
ALTER TYPE "LegalDocumentType" ADD VALUE IF NOT EXISTS 'FORUM_RULES';

CREATE TABLE "user_legal_acceptances" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "acceptance_type" TEXT NOT NULL,
    "document_version_id" UUID,
    "document_checksum" TEXT NOT NULL,
    "label_text" TEXT NOT NULL,
    "accepted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "valid_until" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_legal_acceptances_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "user_legal_acceptances_user_id_acceptance_type_valid_until_idx" ON "user_legal_acceptances"("user_id", "acceptance_type", "valid_until");
CREATE INDEX "user_legal_acceptances_user_id_acceptance_type_accepted_at_idx" ON "user_legal_acceptances"("user_id", "acceptance_type", "accepted_at");

ALTER TABLE "user_legal_acceptances" ADD CONSTRAINT "user_legal_acceptances_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_legal_acceptances" ADD CONSTRAINT "user_legal_acceptances_document_version_id_fkey" FOREIGN KEY ("document_version_id") REFERENCES "legal_document_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
