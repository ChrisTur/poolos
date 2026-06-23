-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "plan" TEXT NOT NULL DEFAULT 'trial',
ADD COLUMN     "planNote" TEXT,
ADD COLUMN     "planUpdatedAt" TIMESTAMP(3),
ADD COLUMN     "trialEndsAt" TIMESTAMP(3);
