-- CreateEnum
CREATE TYPE "FixtureFormat" AS ENUM ('SINGLE_ROUND', 'DOUBLE_ROUND');

-- AlterTable
ALTER TABLE "tournaments"
  ADD COLUMN "fixtureFormat" "FixtureFormat" NOT NULL DEFAULT 'SINGLE_ROUND',
  ADD COLUMN "modality" TEXT;
