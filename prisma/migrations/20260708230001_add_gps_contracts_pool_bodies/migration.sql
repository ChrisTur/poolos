-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "gpsVerificationEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "gpsVerificationRadiusM" INTEGER NOT NULL DEFAULT 300;

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "lat" DOUBLE PRECISION,
ADD COLUMN     "lng" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "ServiceVisit" ADD COLUMN     "contractId" TEXT,
ADD COLUMN     "distanceFromCustomerM" DOUBLE PRECISION,
ADD COLUMN     "poolBodyId" TEXT,
ADD COLUMN     "visitLat" DOUBLE PRECISION,
ADD COLUMN     "visitLng" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "ServiceContract" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "totalVisits" INTEGER NOT NULL,
    "usedVisits" INTEGER NOT NULL DEFAULT 0,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "customerId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,

    CONSTRAINT "ServiceContract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PoolBody" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'pool',
    "volume" DOUBLE PRECISION,
    "shape" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "customerId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,

    CONSTRAINT "PoolBody_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ServiceContract_companyId_status_idx" ON "ServiceContract"("companyId", "status");

-- CreateIndex
CREATE INDEX "ServiceContract_customerId_idx" ON "ServiceContract"("customerId");

-- CreateIndex
CREATE INDEX "PoolBody_customerId_idx" ON "PoolBody"("customerId");

-- CreateIndex
CREATE INDEX "PoolBody_companyId_idx" ON "PoolBody"("companyId");

-- AddForeignKey
ALTER TABLE "ServiceVisit" ADD CONSTRAINT "ServiceVisit_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "ServiceContract"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceVisit" ADD CONSTRAINT "ServiceVisit_poolBodyId_fkey" FOREIGN KEY ("poolBodyId") REFERENCES "PoolBody"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceContract" ADD CONSTRAINT "ServiceContract_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceContract" ADD CONSTRAINT "ServiceContract_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PoolBody" ADD CONSTRAINT "PoolBody_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PoolBody" ADD CONSTRAINT "PoolBody_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
