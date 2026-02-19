-- CreateTable
CREATE TABLE "TeamCompetition" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "metric" TEXT NOT NULL,
    "prizePool" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamCompetition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamCompetitionParticipant" (
    "id" TEXT NOT NULL,
    "competitionId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "currentScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamCompetitionParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamCompetitionWinner" (
    "id" TEXT NOT NULL,
    "competitionId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "prizePoints" INTEGER NOT NULL,
    "finalScore" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamCompetitionWinner_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TeamCompetitionParticipant_competitionId_teamId_key" ON "TeamCompetitionParticipant"("competitionId", "teamId");

-- AddForeignKey
ALTER TABLE "TeamCompetitionParticipant" ADD CONSTRAINT "TeamCompetitionParticipant_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "TeamCompetition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamCompetitionParticipant" ADD CONSTRAINT "TeamCompetitionParticipant_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamCompetitionWinner" ADD CONSTRAINT "TeamCompetitionWinner_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "TeamCompetition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
