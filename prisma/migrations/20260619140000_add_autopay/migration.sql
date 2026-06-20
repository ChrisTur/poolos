ALTER TABLE "Customer" ADD COLUMN "stripeCustomerId" TEXT;
ALTER TABLE "Customer" ADD COLUMN "autoPayEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Customer" ADD COLUMN "autoPayMethodId" TEXT;
