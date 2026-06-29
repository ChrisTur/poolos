-- AlterTable
ALTER TABLE "EmailLog" ADD COLUMN     "resendId" TEXT,
ALTER COLUMN "customerId" DROP NOT NULL;
