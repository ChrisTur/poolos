-- AlterTable: add stripeAccountId to Company
ALTER TABLE "Company" ADD COLUMN "stripeAccountId" TEXT;

-- AlterTable: add payToken and stripePaymentIntentId to Invoice
ALTER TABLE "Invoice" ADD COLUMN "payToken" TEXT;
ALTER TABLE "Invoice" ADD COLUMN "stripePaymentIntentId" TEXT;

-- CreateIndex: unique payToken
CREATE UNIQUE INDEX "Invoice_payToken_key" ON "Invoice"("payToken");
