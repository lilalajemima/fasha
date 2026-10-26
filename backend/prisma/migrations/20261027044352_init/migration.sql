-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('VOLUNTEER', 'ORGANISATION', 'ADMIN');

-- CreateEnum
CREATE TYPE "OpportunityMode" AS ENUM ('PHYSICAL', 'VIRTUAL');

-- CreateEnum
CREATE TYPE "OpportunityStatus" AS ENUM ('PENDING_APPROVAL', 'PUBLISHED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "CollaboratorStatus" AS ENUM ('INVITED', 'ACCEPTED', 'DECLINED');

-- CreateEnum
CREATE TYPE "CheckInMethod" AS ENUM ('QR', 'MANUAL');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'VOLUNTEER',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "volunteer_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "interests" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "availability" TEXT,
    "location" TEXT,
    "portfolio_slug" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "volunteer_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opportunities" (
    "id" TEXT NOT NULL,
    "creator_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "mode" "OpportunityMode" NOT NULL,
    "location" TEXT,
    "max_capacity" INTEGER NOT NULL,
    "application_deadline" TIMESTAMP(3) NOT NULL,
    "status" "OpportunityStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
    "qr_token" TEXT,
    "required_skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "categories" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "opportunities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collaborators" (
    "id" TEXT NOT NULL,
    "opportunity_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "permission_level" TEXT NOT NULL DEFAULT 'CO_ORGANISER',
    "status" "CollaboratorStatus" NOT NULL DEFAULT 'INVITED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "collaborators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applications" (
    "id" TEXT NOT NULL,
    "opportunity_id" TEXT NOT NULL,
    "volunteer_id" TEXT NOT NULL,
    "motivation_statement" TEXT NOT NULL,
    "resume_url" TEXT,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checkins" (
    "id" TEXT NOT NULL,
    "opportunity_id" TEXT NOT NULL,
    "volunteer_id" TEXT NOT NULL,
    "checkin_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkout_time" TIMESTAMP(3),
    "method" "CheckInMethod" NOT NULL DEFAULT 'QR',

    CONSTRAINT "checkins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_submissions" (
    "id" TEXT NOT NULL,
    "opportunity_id" TEXT NOT NULL,
    "volunteer_id" TEXT NOT NULL,
    "hours_claimed" DOUBLE PRECISION NOT NULL,
    "proof_url" TEXT NOT NULL,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "task_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portfolio_entries" (
    "id" TEXT NOT NULL,
    "volunteer_id" TEXT NOT NULL,
    "opportunity_id" TEXT NOT NULL,
    "hours_credited" DOUBLE PRECISION NOT NULL,
    "skills_credited" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "date_credited" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "portfolio_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "volunteer_profiles_user_id_key" ON "volunteer_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "volunteer_profiles_portfolio_slug_key" ON "volunteer_profiles"("portfolio_slug");

-- CreateIndex
CREATE UNIQUE INDEX "collaborators_opportunity_id_user_id_key" ON "collaborators"("opportunity_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "applications_opportunity_id_volunteer_id_key" ON "applications"("opportunity_id", "volunteer_id");

-- AddForeignKey
ALTER TABLE "volunteer_profiles" ADD CONSTRAINT "volunteer_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collaborators" ADD CONSTRAINT "collaborators_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collaborators" ADD CONSTRAINT "collaborators_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_volunteer_id_fkey" FOREIGN KEY ("volunteer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checkins" ADD CONSTRAINT "checkins_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checkins" ADD CONSTRAINT "checkins_volunteer_id_fkey" FOREIGN KEY ("volunteer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_submissions" ADD CONSTRAINT "task_submissions_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_submissions" ADD CONSTRAINT "task_submissions_volunteer_id_fkey" FOREIGN KEY ("volunteer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portfolio_entries" ADD CONSTRAINT "portfolio_entries_volunteer_id_fkey" FOREIGN KEY ("volunteer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portfolio_entries" ADD CONSTRAINT "portfolio_entries_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
