-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "marketingOptIn" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tcAcceptedAt" TIMESTAMP(3);
