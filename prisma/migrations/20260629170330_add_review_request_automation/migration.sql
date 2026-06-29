-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "googleReviewUrl" TEXT,
ADD COLUMN     "reviewRequestAfterVisits" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "reviewRequestEnabled" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "reviewRequestSentAt" TIMESTAMP(3);
