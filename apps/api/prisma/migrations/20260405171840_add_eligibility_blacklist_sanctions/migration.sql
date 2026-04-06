-- CreateEnum
CREATE TYPE "BlacklistStatus" AS ENUM ('ACTIVE', 'LIFTED');

-- CreateEnum
CREATE TYPE "SanctionTargetType" AS ENUM ('PROFILE', 'TEAM');

-- CreateEnum
CREATE TYPE "SanctionKind" AS ENUM ('DISCIPLINARY', 'MONETARY');

-- CreateEnum
CREATE TYPE "SanctionStatus" AS ENUM ('ACTIVE', 'RESOLVED', 'EXPIRED', 'CANCELLED');

-- CreateTable
CREATE TABLE "blacklist_entries" (
    "id" TEXT NOT NULL,
    "profileId" TEXT,
    "documentNumber" TEXT NOT NULL,
    "profileNameSnapshot" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "attachmentUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "BlacklistStatus" NOT NULL DEFAULT 'ACTIVE',
    "blockedByProfileId" TEXT NOT NULL,
    "blockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "liftedByProfileId" TEXT,
    "liftedAt" TIMESTAMP(3),
    "resolutionNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blacklist_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sanctions" (
    "id" TEXT NOT NULL,
    "targetType" "SanctionTargetType" NOT NULL,
    "targetProfileId" TEXT,
    "targetTeamId" TEXT,
    "kind" "SanctionKind" NOT NULL,
    "status" "SanctionStatus" NOT NULL DEFAULT 'ACTIVE',
    "reason" TEXT NOT NULL,
    "notes" TEXT,
    "attachmentUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "matchId" TEXT,
    "tournamentId" TEXT,
    "categoryId" TEXT,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "amount" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'ARS',
    "createdByProfileId" TEXT NOT NULL,
    "resolvedByProfileId" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolutionNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sanctions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "blacklist_entries_documentNumber_idx" ON "blacklist_entries"("documentNumber");

-- CreateIndex
CREATE INDEX "blacklist_entries_profileId_idx" ON "blacklist_entries"("profileId");

-- CreateIndex
CREATE INDEX "blacklist_entries_status_idx" ON "blacklist_entries"("status");

-- CreateIndex
CREATE INDEX "blacklist_entries_blockedByProfileId_idx" ON "blacklist_entries"("blockedByProfileId");

-- CreateIndex
CREATE INDEX "blacklist_entries_liftedByProfileId_idx" ON "blacklist_entries"("liftedByProfileId");

-- CreateIndex
CREATE INDEX "sanctions_targetProfileId_idx" ON "sanctions"("targetProfileId");

-- CreateIndex
CREATE INDEX "sanctions_targetTeamId_idx" ON "sanctions"("targetTeamId");

-- CreateIndex
CREATE INDEX "sanctions_status_idx" ON "sanctions"("status");

-- CreateIndex
CREATE INDEX "sanctions_tournamentId_idx" ON "sanctions"("tournamentId");

-- CreateIndex
CREATE INDEX "sanctions_categoryId_idx" ON "sanctions"("categoryId");

-- CreateIndex
CREATE INDEX "sanctions_matchId_idx" ON "sanctions"("matchId");

-- CreateIndex
CREATE INDEX "sanctions_createdByProfileId_idx" ON "sanctions"("createdByProfileId");

-- CreateIndex
CREATE INDEX "sanctions_resolvedByProfileId_idx" ON "sanctions"("resolvedByProfileId");

-- AddForeignKey
ALTER TABLE "blacklist_entries" ADD CONSTRAINT "blacklist_entries_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blacklist_entries" ADD CONSTRAINT "blacklist_entries_blockedByProfileId_fkey" FOREIGN KEY ("blockedByProfileId") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blacklist_entries" ADD CONSTRAINT "blacklist_entries_liftedByProfileId_fkey" FOREIGN KEY ("liftedByProfileId") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sanctions" ADD CONSTRAINT "sanctions_targetProfileId_fkey" FOREIGN KEY ("targetProfileId") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sanctions" ADD CONSTRAINT "sanctions_targetTeamId_fkey" FOREIGN KEY ("targetTeamId") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sanctions" ADD CONSTRAINT "sanctions_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "matches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sanctions" ADD CONSTRAINT "sanctions_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "tournaments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sanctions" ADD CONSTRAINT "sanctions_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sanctions" ADD CONSTRAINT "sanctions_createdByProfileId_fkey" FOREIGN KEY ("createdByProfileId") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sanctions" ADD CONSTRAINT "sanctions_resolvedByProfileId_fkey" FOREIGN KEY ("resolvedByProfileId") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
