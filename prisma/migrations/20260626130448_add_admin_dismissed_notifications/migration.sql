-- CreateTable
CREATE TABLE "AdminDismissedNotification" (
    "notificationId" TEXT NOT NULL,
    "dismissedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminDismissedNotification_pkey" PRIMARY KEY ("notificationId")
);
