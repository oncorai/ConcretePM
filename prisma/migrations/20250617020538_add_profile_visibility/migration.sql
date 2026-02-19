-- CreateEnum
CREATE TYPE "ProfileVisibility" AS ENUM ('PUBLIC', 'CONTRACTORS', 'PRIVATE');

-- AlterTable
ALTER TABLE "WorkerProfile" ADD COLUMN     "profileVisibility" "ProfileVisibility" NOT NULL DEFAULT 'PUBLIC',
ADD COLUMN     "showEmail" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "showLocation" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "showPhone" BOOLEAN NOT NULL DEFAULT true;
