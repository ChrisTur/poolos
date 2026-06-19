ALTER TABLE "User" ADD COLUMN "passwordResetToken" TEXT;
ALTER TABLE "User" ADD COLUMN "passwordResetExpiry" TIMESTAMP(3);
CREATE UNIQUE INDEX "User_passwordResetToken_key" ON "User"("passwordResetToken");
