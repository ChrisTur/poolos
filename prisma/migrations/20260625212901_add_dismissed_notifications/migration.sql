-- CreateTable
CREATE TABLE "DismissedNotification" (
    "companyId" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "dismissedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DismissedNotification_pkey" PRIMARY KEY ("companyId","notificationId")
);

-- CreateIndex
CREATE INDEX "DismissedNotification_companyId_idx" ON "DismissedNotification"("companyId");

-- AddForeignKey
ALTER TABLE "DismissedNotification" ADD CONSTRAINT "DismissedNotification_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
