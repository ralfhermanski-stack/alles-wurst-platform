-- Revisionssichere Vertragsnachweise erweitern
ALTER TABLE "purchase_legal_records" ADD COLUMN "client_ip_hash" TEXT;
ALTER TABLE "purchase_legal_records" ADD COLUMN "user_agent_hash" TEXT;
ALTER TABLE "purchase_legal_records" ADD COLUMN "order_number" TEXT;
ALTER TABLE "purchase_legal_records" ADD COLUMN "product_name" TEXT;
ALTER TABLE "purchase_legal_records" ADD COLUMN "product_slug" TEXT;
ALTER TABLE "purchase_legal_records" ADD COLUMN "membership_role" TEXT;
ALTER TABLE "purchase_legal_records" ADD COLUMN "consent_text_version" TEXT;

CREATE INDEX "purchase_legal_records_order_number_idx" ON "purchase_legal_records"("order_number");
