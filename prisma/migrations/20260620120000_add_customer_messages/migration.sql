CREATE TABLE "CustomerMessage" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "body" TEXT NOT NULL,
  "fromCompany" BOOLEAN NOT NULL DEFAULT true,
  "sentViaEmail" BOOLEAN NOT NULL DEFAULT false,
  "serviceVisitId" TEXT,
  "customerId" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  CONSTRAINT "CustomerMessage_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "CustomerMessage" ADD CONSTRAINT "CustomerMessage_customerId_fkey"
  FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CustomerMessage" ADD CONSTRAINT "CustomerMessage_companyId_fkey"
  FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "CustomerMessage_customerId_idx" ON "CustomerMessage"("customerId");
CREATE INDEX "CustomerMessage_companyId_idx" ON "CustomerMessage"("companyId");
