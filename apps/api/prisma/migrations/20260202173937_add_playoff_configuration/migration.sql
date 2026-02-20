-- DropForeignKey
ALTER TABLE "matches" DROP CONSTRAINT "matches_awayTeamId_fkey";

-- DropForeignKey
ALTER TABLE "matches" DROP CONSTRAINT "matches_homeTeamId_fkey";

-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "playoffSeedingMethod" TEXT DEFAULT 'zone_position',
ADD COLUMN     "playoffTeamsTotal" INTEGER,
ADD COLUMN     "playoffsGenerated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "regularPhaseCompleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "teamsQualifyPerZone" INTEGER DEFAULT 2;

-- AlterTable
ALTER TABLE "matches" ADD COLUMN     "awayFromMatchId" TEXT,
ADD COLUMN     "awayFromPosition" TEXT,
ADD COLUMN     "awaySeed" INTEGER,
ADD COLUMN     "bracketPosition" TEXT,
ADD COLUMN     "homeFromMatchId" TEXT,
ADD COLUMN     "homeFromPosition" TEXT,
ADD COLUMN     "homeSeed" INTEGER,
ADD COLUMN     "playoffPosition" INTEGER,
ADD COLUMN     "playoffRound" INTEGER,
ALTER COLUMN "homeTeamId" DROP NOT NULL,
ALTER COLUMN "awayTeamId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "matches_playoffRound_idx" ON "matches"("playoffRound");

-- CreateIndex
CREATE INDEX "matches_bracketPosition_idx" ON "matches"("bracketPosition");

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_homeTeamId_fkey" FOREIGN KEY ("homeTeamId") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_awayTeamId_fkey" FOREIGN KEY ("awayTeamId") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;
