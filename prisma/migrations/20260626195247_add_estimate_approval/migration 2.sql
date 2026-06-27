-- AlterTable
ALTER TABLE "Estimate" ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "denialReason" TEXT,
ADD COLUMN     "deniedAt" TIMESTAMP(3),
ADD COLUMN     "signatureData" TEXT,
ADD COLUMN     "signedAt" TIMESTAMP(3),
ADD COLUMN     "signedByName" TEXT;
