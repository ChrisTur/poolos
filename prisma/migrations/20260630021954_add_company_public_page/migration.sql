-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "publicPageAbout" TEXT,
ADD COLUMN     "publicPageEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "publicPageTagline" TEXT,
ADD COLUMN     "serviceArea" TEXT;
