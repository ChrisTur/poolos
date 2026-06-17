-- AlterTable
ALTER TABLE "Equipment" ADD COLUMN     "warrantyExpiry" TIMESTAMP(3),
ADD COLUMN     "warrantyNotes" TEXT,
ADD COLUMN     "warrantyProvider" TEXT;
