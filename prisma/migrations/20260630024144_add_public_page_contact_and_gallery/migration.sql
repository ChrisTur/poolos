-- AlterTable
ALTER TABLE "Attachment" ADD COLUMN     "isPublicGallery" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "publicPageShowAddress" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "publicPageShowEmail" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "publicPageShowPhone" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "publicPageShowReviews" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "publicPageShowWebsite" BOOLEAN NOT NULL DEFAULT true;
