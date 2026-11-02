-- AlterTable
ALTER TABLE "opportunities" ADD COLUMN     "review_note" TEXT,
ADD COLUMN     "reviewed_at" TIMESTAMP(3),
ADD COLUMN     "sector" TEXT;

-- AlterTable
ALTER TABLE "volunteer_profiles" ADD COLUMN     "sector" TEXT;
