-- Company: late fee and card fee settings
ALTER TABLE "Company" ADD COLUMN "lateFeeEnabled"   BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Company" ADD COLUMN "lateFeePercent"   DOUBLE PRECISION NOT NULL DEFAULT 1.5;
ALTER TABLE "Company" ADD COLUMN "lateFeeGraceDays" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Company" ADD COLUMN "cardFeeEnabled"   BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Company" ADD COLUMN "cardFeePercent"   DOUBLE PRECISION NOT NULL DEFAULT 2.9;
ALTER TABLE "Company" ADD COLUMN "cardFeeFixed"     DOUBLE PRECISION NOT NULL DEFAULT 0.30;

-- Customer: portal token
ALTER TABLE "Customer" ADD COLUMN "portalToken" TEXT;
CREATE UNIQUE INDEX "Customer_portalToken_key" ON "Customer"("portalToken");

-- Invoice: track whether late fee was already applied
ALTER TABLE "Invoice" ADD COLUMN "lateFeeApplied" BOOLEAN NOT NULL DEFAULT false;
