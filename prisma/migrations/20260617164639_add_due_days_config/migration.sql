-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "defaultDueDays" INTEGER NOT NULL DEFAULT 30;

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "dueDays" INTEGER;
