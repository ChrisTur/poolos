-- AlterTable: add feedback fields to ServiceVisit
ALTER TABLE "ServiceVisit" ADD COLUMN "feedbackToken" TEXT;
ALTER TABLE "ServiceVisit" ADD COLUMN "rating" INTEGER;
ALTER TABLE "ServiceVisit" ADD COLUMN "feedbackComment" TEXT;

-- CreateIndex: unique feedbackToken
CREATE UNIQUE INDEX "ServiceVisit_feedbackToken_key" ON "ServiceVisit"("feedbackToken");

-- CreateTable: ChemicalUsage
CREATE TABLE "ChemicalUsage" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "productName" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'oz',
    "unitCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "visitId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,

    CONSTRAINT "ChemicalUsage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChemicalUsage_companyId_idx" ON "ChemicalUsage"("companyId");
CREATE INDEX "ChemicalUsage_visitId_idx" ON "ChemicalUsage"("visitId");

-- AddForeignKey
ALTER TABLE "ChemicalUsage" ADD CONSTRAINT "ChemicalUsage_visitId_fkey"
    FOREIGN KEY ("visitId") REFERENCES "ServiceVisit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ChemicalUsage" ADD CONSTRAINT "ChemicalUsage_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
