-- AlterTable
ALTER TABLE "task_submissions" ADD COLUMN     "review_note" TEXT;

-- CreateTable
CREATE TABLE "opportunity_briefs" (
    "id" TEXT NOT NULL,
    "opportunity_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "opportunity_briefs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "opportunity_briefs_opportunity_id_key" ON "opportunity_briefs"("opportunity_id");

-- AddForeignKey
ALTER TABLE "opportunity_briefs" ADD CONSTRAINT "opportunity_briefs_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
