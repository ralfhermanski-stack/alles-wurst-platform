-- AlterTable
ALTER TABLE "data_export_requests" ADD COLUMN "privacy_request_id" UUID;

-- CreateIndex
CREATE UNIQUE INDEX "data_export_requests_privacy_request_id_key" ON "data_export_requests"("privacy_request_id");

-- AddForeignKey
ALTER TABLE "data_export_requests" ADD CONSTRAINT "data_export_requests_privacy_request_id_fkey" FOREIGN KEY ("privacy_request_id") REFERENCES "privacy_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;
