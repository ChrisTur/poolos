-- CreateTable
CREATE TABLE "ContactMessage" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'new',
    "replyBody" TEXT,
    "repliedAt" TIMESTAMP(3),
    "repliedBy" TEXT,

    CONSTRAINT "ContactMessage_pkey" PRIMARY KEY ("id")
);
