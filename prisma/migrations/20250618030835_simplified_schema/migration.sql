/*
  Warnings:

  - You are about to drop the column `emailVerified` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `Achievement` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Certification` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Challenge` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ChallengeProgress` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ContractorProfile` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `JobPosting` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Notification` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PasswordResetToken` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProductivityEntry` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Reward` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Team` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TeamCompetition` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TeamCompetitionParticipant` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TeamCompetitionWinner` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TeamMember` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `VerificationToken` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `WorkHistory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `WorkerAchievement` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `WorkerProfile` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `WorkerReward` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Certification" DROP CONSTRAINT "Certification_workerId_fkey";

-- DropForeignKey
ALTER TABLE "ChallengeProgress" DROP CONSTRAINT "ChallengeProgress_challengeId_fkey";

-- DropForeignKey
ALTER TABLE "ChallengeProgress" DROP CONSTRAINT "ChallengeProgress_workerId_fkey";

-- DropForeignKey
ALTER TABLE "ContractorProfile" DROP CONSTRAINT "ContractorProfile_userId_fkey";

-- DropForeignKey
ALTER TABLE "JobPosting" DROP CONSTRAINT "JobPosting_contractorId_fkey";

-- DropForeignKey
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_userId_fkey";

-- DropForeignKey
ALTER TABLE "PasswordResetToken" DROP CONSTRAINT "PasswordResetToken_userId_fkey";

-- DropForeignKey
ALTER TABLE "ProductivityEntry" DROP CONSTRAINT "ProductivityEntry_supervisorId_fkey";

-- DropForeignKey
ALTER TABLE "ProductivityEntry" DROP CONSTRAINT "ProductivityEntry_workerId_fkey";

-- DropForeignKey
ALTER TABLE "Team" DROP CONSTRAINT "Team_contractorId_fkey";

-- DropForeignKey
ALTER TABLE "TeamCompetitionParticipant" DROP CONSTRAINT "TeamCompetitionParticipant_competitionId_fkey";

-- DropForeignKey
ALTER TABLE "TeamCompetitionParticipant" DROP CONSTRAINT "TeamCompetitionParticipant_teamId_fkey";

-- DropForeignKey
ALTER TABLE "TeamCompetitionWinner" DROP CONSTRAINT "TeamCompetitionWinner_competitionId_fkey";

-- DropForeignKey
ALTER TABLE "TeamMember" DROP CONSTRAINT "TeamMember_teamId_fkey";

-- DropForeignKey
ALTER TABLE "TeamMember" DROP CONSTRAINT "TeamMember_workerId_fkey";

-- DropForeignKey
ALTER TABLE "VerificationToken" DROP CONSTRAINT "VerificationToken_userId_fkey";

-- DropForeignKey
ALTER TABLE "WorkHistory" DROP CONSTRAINT "WorkHistory_workerId_fkey";

-- DropForeignKey
ALTER TABLE "WorkerAchievement" DROP CONSTRAINT "WorkerAchievement_achievementId_fkey";

-- DropForeignKey
ALTER TABLE "WorkerAchievement" DROP CONSTRAINT "WorkerAchievement_workerId_fkey";

-- DropForeignKey
ALTER TABLE "WorkerProfile" DROP CONSTRAINT "WorkerProfile_userId_fkey";

-- DropForeignKey
ALTER TABLE "WorkerReward" DROP CONSTRAINT "WorkerReward_rewardId_fkey";

-- DropForeignKey
ALTER TABLE "WorkerReward" DROP CONSTRAINT "WorkerReward_workerId_fkey";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "emailVerified",
DROP COLUMN "role",
ALTER COLUMN "name" DROP NOT NULL;

-- DropTable
DROP TABLE "Achievement";

-- DropTable
DROP TABLE "Certification";

-- DropTable
DROP TABLE "Challenge";

-- DropTable
DROP TABLE "ChallengeProgress";

-- DropTable
DROP TABLE "ContractorProfile";

-- DropTable
DROP TABLE "JobPosting";

-- DropTable
DROP TABLE "Notification";

-- DropTable
DROP TABLE "PasswordResetToken";

-- DropTable
DROP TABLE "ProductivityEntry";

-- DropTable
DROP TABLE "Reward";

-- DropTable
DROP TABLE "Team";

-- DropTable
DROP TABLE "TeamCompetition";

-- DropTable
DROP TABLE "TeamCompetitionParticipant";

-- DropTable
DROP TABLE "TeamCompetitionWinner";

-- DropTable
DROP TABLE "TeamMember";

-- DropTable
DROP TABLE "VerificationToken";

-- DropTable
DROP TABLE "WorkHistory";

-- DropTable
DROP TABLE "WorkerAchievement";

-- DropTable
DROP TABLE "WorkerProfile";

-- DropTable
DROP TABLE "WorkerReward";

-- DropEnum
DROP TYPE "AchievementCategory";

-- DropEnum
DROP TYPE "ProfileVisibility";

-- DropEnum
DROP TYPE "RewardCategory";

-- DropEnum
DROP TYPE "Role";

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "budgetHours" DOUBLE PRECISION NOT NULL,
    "budgetQuantity" DOUBLE PRECISION,
    "unit" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyReport" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "weather" TEXT,
    "notes" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyProgress" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "hoursWorked" DOUBLE PRECISION NOT NULL,
    "quantityComplete" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DailyReport_projectId_date_key" ON "DailyReport"("projectId", "date");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyReport" ADD CONSTRAINT "DailyReport_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyReport" ADD CONSTRAINT "DailyReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyProgress" ADD CONSTRAINT "DailyProgress_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "DailyReport"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyProgress" ADD CONSTRAINT "DailyProgress_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
