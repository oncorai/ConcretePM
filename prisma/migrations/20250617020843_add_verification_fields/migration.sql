-- AlterTable
ALTER TABLE "ContractorProfile" ADD COLUMN     "verificationNotes" TEXT,
ADD COLUMN     "verificationRequested" BOOLEAN NOT NULL DEFAULT false;
