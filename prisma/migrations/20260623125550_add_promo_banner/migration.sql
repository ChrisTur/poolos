-- CreateTable
CREATE TABLE "PromoBanner" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "message" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "dismissible" BOOLEAN NOT NULL DEFAULT true,
    "showOnMarketing" BOOLEAN NOT NULL DEFAULT true,
    "showInApp" BOOLEAN NOT NULL DEFAULT true,
    "bgColor" TEXT NOT NULL DEFAULT 'sky',
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "PromoBanner_pkey" PRIMARY KEY ("id")
);
