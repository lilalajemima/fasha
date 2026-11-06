/*
  Warnings:

  - You are about to drop the column `availability` on the `volunteer_profiles` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "volunteer_profiles" DROP COLUMN "availability",
ADD COLUMN     "availability_slots" TEXT[] DEFAULT ARRAY[]::TEXT[];
