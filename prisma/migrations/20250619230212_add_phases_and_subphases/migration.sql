-- AlterTable
ALTER TABLE "DailyProgress" ADD COLUMN     "subPhaseId" TEXT,
ALTER COLUMN "taskId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Phase" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Phase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubPhase" (
    "id" TEXT NOT NULL,
    "phaseId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "budgetHours" DOUBLE PRECISION NOT NULL,
    "budgetQuantity" DOUBLE PRECISION,
    "unit" TEXT,
    "orderIndex" INTEGER NOT NULL,
    "initialHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "initialQuantity" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubPhase_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Phase" ADD CONSTRAINT "Phase_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubPhase" ADD CONSTRAINT "SubPhase_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "Phase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyProgress" ADD CONSTRAINT "DailyProgress_subPhaseId_fkey" FOREIGN KEY ("subPhaseId") REFERENCES "SubPhase"("id") ON DELETE CASCADE ON UPDATE CASCADE;
