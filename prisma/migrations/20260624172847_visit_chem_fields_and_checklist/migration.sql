-- AlterTable
ALTER TABLE "ServiceVisit" ADD COLUMN     "cya" DOUBLE PRECISION,
ADD COLUMN     "salt" DOUBLE PRECISION,
ADD COLUMN     "saltwater" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "VisitChecklistItem" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "label" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "companyId" TEXT NOT NULL,

    CONSTRAINT "VisitChecklistItem_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "VisitChecklistItem" ADD CONSTRAINT "VisitChecklistItem_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
