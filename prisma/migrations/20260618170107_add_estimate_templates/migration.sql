-- CreateTable
CREATE TABLE "EstimateTemplate" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "companyId" TEXT NOT NULL,

    CONSTRAINT "EstimateTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EstimateTemplateItem" (
    "id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "templateId" TEXT NOT NULL,

    CONSTRAINT "EstimateTemplateItem_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "EstimateTemplate" ADD CONSTRAINT "EstimateTemplate_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstimateTemplateItem" ADD CONSTRAINT "EstimateTemplateItem_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "EstimateTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
