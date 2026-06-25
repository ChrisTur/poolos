-- AlterTable
ALTER TABLE "Equipment" ADD COLUMN     "lastServicedAt" TIMESTAMP(3),
ADD COLUMN     "serviceIntervalDays" INTEGER;

-- CreateTable
CREATE TABLE "EquipmentService" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "parts" TEXT,
    "laborCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "partsCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT,
    "technicianId" TEXT,
    "equipmentId" TEXT NOT NULL,

    CONSTRAINT "EquipmentService_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "EquipmentService" ADD CONSTRAINT "EquipmentService_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipmentService" ADD CONSTRAINT "EquipmentService_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
