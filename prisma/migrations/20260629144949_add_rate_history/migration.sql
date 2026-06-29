-- CreateTable
CREATE TABLE "RateHistory" (
    "id" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "oldRate" DOUBLE PRECISION NOT NULL,
    "newRate" DOUBLE PRECISION NOT NULL,
    "note" TEXT,
    "customerId" TEXT NOT NULL,
    "changedById" TEXT,
    "companyId" TEXT NOT NULL,

    CONSTRAINT "RateHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RateHistory_customerId_idx" ON "RateHistory"("customerId");

-- CreateIndex
CREATE INDEX "RateHistory_companyId_idx" ON "RateHistory"("companyId");

-- AddForeignKey
ALTER TABLE "RateHistory" ADD CONSTRAINT "RateHistory_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RateHistory" ADD CONSTRAINT "RateHistory_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RateHistory" ADD CONSTRAINT "RateHistory_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
