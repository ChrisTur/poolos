-- AlterTable
ALTER TABLE "VisitChecklistItem" ADD COLUMN     "customerId" TEXT;

-- AddForeignKey
ALTER TABLE "VisitChecklistItem" ADD CONSTRAINT "VisitChecklistItem_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
