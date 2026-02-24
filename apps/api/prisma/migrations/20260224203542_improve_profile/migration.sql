/*
  Warnings:

  - You are about to drop the column `playoffFormat` on the `categories` table. All the data in the column will be lost.
  - You are about to drop the column `playoffSeedingMethod` on the `categories` table. All the data in the column will be lost.
  - You are about to drop the column `playoffTeamsTotal` on the `categories` table. All the data in the column will be lost.
  - You are about to drop the column `playoffsGenerated` on the `categories` table. All the data in the column will be lost.
  - You are about to drop the column `regularPhaseCompleted` on the `categories` table. All the data in the column will be lost.
  - You are about to drop the column `sportId` on the `categories` table. All the data in the column will be lost.
  - You are about to drop the column `teamsQualifyPerZone` on the `categories` table. All the data in the column will be lost.
  - You are about to drop the column `awayFromMatchId` on the `matches` table. All the data in the column will be lost.
  - You are about to drop the column `awayFromPosition` on the `matches` table. All the data in the column will be lost.
  - You are about to drop the column `awaySeed` on the `matches` table. All the data in the column will be lost.
  - You are about to drop the column `bracketPosition` on the `matches` table. All the data in the column will be lost.
  - You are about to drop the column `homeFromMatchId` on the `matches` table. All the data in the column will be lost.
  - You are about to drop the column `homeFromPosition` on the `matches` table. All the data in the column will be lost.
  - You are about to drop the column `homeSeed` on the `matches` table. All the data in the column will be lost.
  - You are about to drop the column `liveStatsJson` on the `matches` table. All the data in the column will be lost.
  - You are about to drop the column `playoffPosition` on the `matches` table. All the data in the column will be lost.
  - You are about to drop the column `playoffRound` on the `matches` table. All the data in the column will be lost.
  - You are about to drop the column `processedStats` on the `matches` table. All the data in the column will be lost.
  - You are about to drop the column `playerId` on the `player_teams` table. All the data in the column will be lost.
  - The `status` column on the `tournaments` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `messages` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `notifications` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `permissions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `players` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `profile_roles` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `reports` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `role_permissions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `roles` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `settings` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `support_ticket_comments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `support_tickets` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[profileId,teamId]` on the table `player_teams` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[documentNumber]` on the table `profiles` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `profileId` to the `player_teams` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ProfileRole" AS ENUM ('master', 'admin', 'player', 'photographer', 'referee', 'official');

-- CreateEnum
CREATE TYPE "TournamentStatus" AS ENUM ('DRAFT', 'OPEN', 'CLOSED', 'READY_TO_SHIP', 'IN_PROGRESS', 'FINISHED', 'ARCHIVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CategoryStatus" AS ENUM ('OPEN', 'CLOSED', 'IN_PROGRESS', 'FINISHED');

-- CreateEnum
CREATE TYPE "CategorySubstatus" AS ENUM ('REGULAR_FASE', 'PLAYOFFS_FASE');

-- DropForeignKey
ALTER TABLE "categories" DROP CONSTRAINT "categories_sportId_fkey";

-- DropForeignKey
ALTER TABLE "messages" DROP CONSTRAINT "messages_recipientId_fkey";

-- DropForeignKey
ALTER TABLE "messages" DROP CONSTRAINT "messages_relatedMatchId_fkey";

-- DropForeignKey
ALTER TABLE "messages" DROP CONSTRAINT "messages_relatedTournamentId_fkey";

-- DropForeignKey
ALTER TABLE "messages" DROP CONSTRAINT "messages_senderId_fkey";

-- DropForeignKey
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_profileId_fkey";

-- DropForeignKey
ALTER TABLE "player_teams" DROP CONSTRAINT "player_teams_playerId_fkey";

-- DropForeignKey
ALTER TABLE "profile_roles" DROP CONSTRAINT "profile_roles_profileId_fkey";

-- DropForeignKey
ALTER TABLE "profile_roles" DROP CONSTRAINT "profile_roles_roleId_fkey";

-- DropForeignKey
ALTER TABLE "reports" DROP CONSTRAINT "reports_generatedBy_fkey";

-- DropForeignKey
ALTER TABLE "role_permissions" DROP CONSTRAINT "role_permissions_permissionId_fkey";

-- DropForeignKey
ALTER TABLE "role_permissions" DROP CONSTRAINT "role_permissions_roleId_fkey";

-- DropForeignKey
ALTER TABLE "support_ticket_comments" DROP CONSTRAINT "support_ticket_comments_profileId_fkey";

-- DropForeignKey
ALTER TABLE "support_ticket_comments" DROP CONSTRAINT "support_ticket_comments_ticketId_fkey";

-- DropForeignKey
ALTER TABLE "support_tickets" DROP CONSTRAINT "support_tickets_assignedTo_fkey";

-- DropForeignKey
ALTER TABLE "support_tickets" DROP CONSTRAINT "support_tickets_profileId_fkey";

-- DropForeignKey
ALTER TABLE "teams" DROP CONSTRAINT "teams_captainId_fkey";

-- DropForeignKey
ALTER TABLE "teams" DROP CONSTRAINT "teams_creatorId_fkey";

-- DropIndex
DROP INDEX "matches_bracketPosition_idx";

-- DropIndex
DROP INDEX "matches_playoffRound_idx";

-- DropIndex
DROP INDEX "player_teams_playerId_idx";

-- DropIndex
DROP INDEX "player_teams_playerId_teamId_key";

-- AlterTable
ALTER TABLE "categories" DROP COLUMN "playoffFormat",
DROP COLUMN "playoffSeedingMethod",
DROP COLUMN "playoffTeamsTotal",
DROP COLUMN "playoffsGenerated",
DROP COLUMN "regularPhaseCompleted",
DROP COLUMN "sportId",
DROP COLUMN "teamsQualifyPerZone",
ADD COLUMN     "maxTeams" INTEGER,
ADD COLUMN     "status" "CategoryStatus" NOT NULL DEFAULT 'OPEN',
ADD COLUMN     "substatus" "CategorySubstatus";

-- AlterTable
ALTER TABLE "matches" DROP COLUMN "awayFromMatchId",
DROP COLUMN "awayFromPosition",
DROP COLUMN "awaySeed",
DROP COLUMN "bracketPosition",
DROP COLUMN "homeFromMatchId",
DROP COLUMN "homeFromPosition",
DROP COLUMN "homeSeed",
DROP COLUMN "liveStatsJson",
DROP COLUMN "playoffPosition",
DROP COLUMN "playoffRound",
DROP COLUMN "processedStats";

-- AlterTable
ALTER TABLE "player_teams" DROP COLUMN "playerId",
ADD COLUMN     "position" TEXT,
ADD COLUMN     "profileId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "profiles" ADD COLUMN     "role" "ProfileRole" NOT NULL DEFAULT 'player',
ALTER COLUMN "supabaseUserId" DROP NOT NULL,
ALTER COLUMN "email" DROP NOT NULL;

-- AlterTable
ALTER TABLE "registrations" ADD COLUMN     "paymentProofUrl" TEXT;

-- AlterTable
ALTER TABLE "teams" ADD COLUMN     "franchiseId" TEXT,
ALTER COLUMN "creatorId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "tournaments" ADD COLUMN     "insurancePerPlayer" DOUBLE PRECISION,
DROP COLUMN "status",
ADD COLUMN     "status" "TournamentStatus" NOT NULL DEFAULT 'DRAFT';

-- DropTable
DROP TABLE "messages";

-- DropTable
DROP TABLE "notifications";

-- DropTable
DROP TABLE "permissions";

-- DropTable
DROP TABLE "players";

-- DropTable
DROP TABLE "profile_roles";

-- DropTable
DROP TABLE "reports";

-- DropTable
DROP TABLE "role_permissions";

-- DropTable
DROP TABLE "roles";

-- DropTable
DROP TABLE "settings";

-- DropTable
DROP TABLE "support_ticket_comments";

-- DropTable
DROP TABLE "support_tickets";

-- CreateTable
CREATE TABLE "franchises" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logoUrl" TEXT,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "franchises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournament_registration_pricing" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validTo" TIMESTAMP(3) NOT NULL,
    "entryFeeAmount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'ARS',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tournament_registration_pricing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "match_rosters" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "jerseyNumber" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "match_rosters_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "franchises_ownerId_idx" ON "franchises"("ownerId");

-- CreateIndex
CREATE INDEX "tournament_registration_pricing_tournamentId_idx" ON "tournament_registration_pricing"("tournamentId");

-- CreateIndex
CREATE INDEX "tournament_registration_pricing_tournamentId_validFrom_vali_idx" ON "tournament_registration_pricing"("tournamentId", "validFrom", "validTo");

-- CreateIndex
CREATE INDEX "match_rosters_matchId_idx" ON "match_rosters"("matchId");

-- CreateIndex
CREATE INDEX "match_rosters_profileId_idx" ON "match_rosters"("profileId");

-- CreateIndex
CREATE UNIQUE INDEX "match_rosters_matchId_profileId_key" ON "match_rosters"("matchId", "profileId");

-- CreateIndex
CREATE INDEX "categories_status_idx" ON "categories"("status");

-- CreateIndex
CREATE INDEX "player_teams_profileId_idx" ON "player_teams"("profileId");

-- CreateIndex
CREATE UNIQUE INDEX "player_teams_profileId_teamId_key" ON "player_teams"("profileId", "teamId");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_documentNumber_key" ON "profiles"("documentNumber");

-- CreateIndex
CREATE INDEX "teams_franchiseId_idx" ON "teams"("franchiseId");

-- CreateIndex
CREATE INDEX "tournaments_status_idx" ON "tournaments"("status");

-- AddForeignKey
ALTER TABLE "franchises" ADD CONSTRAINT "franchises_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_franchiseId_fkey" FOREIGN KEY ("franchiseId") REFERENCES "franchises"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_captainId_fkey" FOREIGN KEY ("captainId") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_teams" ADD CONSTRAINT "player_teams_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_registration_pricing" ADD CONSTRAINT "tournament_registration_pricing_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "tournaments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_rosters" ADD CONSTRAINT "match_rosters_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "matches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_rosters" ADD CONSTRAINT "match_rosters_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
