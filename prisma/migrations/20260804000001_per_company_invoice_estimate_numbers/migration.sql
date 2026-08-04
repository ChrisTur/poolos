-- Drop global unique indexes
DROP INDEX "Invoice_invoiceNumber_key";
DROP INDEX "Estimate_estimateNumber_key";

-- Create per-company compound unique indexes
CREATE UNIQUE INDEX "Invoice_companyId_invoiceNumber_key" ON "Invoice"("companyId", "invoiceNumber");
CREATE UNIQUE INDEX "Estimate_companyId_estimateNumber_key" ON "Estimate"("companyId", "estimateNumber");
