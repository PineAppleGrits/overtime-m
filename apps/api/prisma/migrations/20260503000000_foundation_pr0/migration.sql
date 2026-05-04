-- CreateEnum
CREATE TYPE "MediaVisibility" AS ENUM ('PUBLIC', 'PRIVATE');

-- CreateEnum
CREATE TYPE "MediaCategory" AS ENUM ('AVATAR', 'TEAM_LOGO', 'FRANCHISE_LOGO', 'TOURNAMENT_BANNER', 'PAYMENT_PROOF', 'MEDICAL_CERT', 'SWORN_STATEMENT', 'DNI_PHOTO', 'SANCTION_ATTACHMENT', 'BLACKLIST_ATTACHMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "PlayoffRound" AS ENUM ('PLAY_IN', 'ROUND_OF_16', 'QUARTERFINAL', 'SEMIFINAL', 'THIRD_PLACE', 'FINAL', 'PROMOTION_PLAYOFF');

-- CreateEnum
CREATE TYPE "PlayoffFormat" AS ENUM ('BO1', 'BO3', 'BO5');

-- CreateEnum
CREATE TYPE "PlayoffSeriesStatus" AS ENUM ('PENDING', 'READY', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "FriendlyStatus" AS ENUM ('REQUESTED', 'GENERATED', 'PENDING_CONFIRMATION', 'CONFIRMED', 'EXPIRED', 'CANCELLED', 'PLAYED', 'OBSERVED_FOR_CATEGORIZATION');

-- CreateEnum
CREATE TYPE "DebtType" AS ENUM ('REGISTRATION_FEE', 'INSURANCE', 'LATE_ROSTER_FEE', 'MATCH_FEE', 'FRIENDLY_DEPOSIT', 'MISSED_MATCH_FINE', 'LATE_NOTICE_FINE', 'LATE_PAYMENT_DAILY_CHARGE', 'OVERDUE_INTEREST', 'AJC_FEE', 'OTHER_MANUAL');

-- CreateEnum
CREATE TYPE "DebtStatus" AS ENUM ('APPROVED', 'PARTIALLY_PAID', 'PAID', 'DELETED_BY_ERROR', 'DELETED_WITH_RECORD', 'CANCELLED');

-- AlterTable
ALTER TABLE "profiles" ADD COLUMN     "avatarAssetId" TEXT,
ADD COLUMN     "currentMedicalAssetId" TEXT,
ADD COLUMN     "currentSwornAssetId" TEXT,
ADD COLUMN     "dniPhotoAssetId" TEXT;

-- AlterTable
ALTER TABLE "teams" ADD COLUMN     "logoAssetId" TEXT;

-- AlterTable
ALTER TABLE "tournaments" ADD COLUMN     "earlyCancellationThresholdHours" INTEGER,
ADD COLUMN     "promotionPlayoffFormat" "PlayoffFormat" NOT NULL DEFAULT 'BO1';

-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "categoryLevelId" TEXT,
ADD COLUMN     "hasPlayIn" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hasThirdPlaceMatch" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "playoffFormatByRound" JSONB,
ADD COLUMN     "qualifierCount" INTEGER,
ADD COLUMN     "qualifiersPerZone" INTEGER,
ADD COLUMN     "zonesCount" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "matches" ADD COLUMN     "playoffStage" "PlayoffRound",
ADD COLUMN     "seriesGameNumber" INTEGER,
ADD COLUMN     "seriesId" TEXT;

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "debtId" TEXT;

-- CreateTable
CREATE TABLE "media_assets" (
    "id" TEXT NOT NULL,
    "bucket" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "sha256" TEXT NOT NULL,
    "originalFilename" TEXT NOT NULL,
    "uploadedByProfileId" TEXT NOT NULL,
    "visibility" "MediaVisibility" NOT NULL,
    "category" "MediaCategory" NOT NULL,
    "metadata" JSONB,
    "scheduledDeletionAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "media_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "category_levels" (
    "id" TEXT NOT NULL,
    "sportId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "category_levels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_category_levels" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "categoryLevelId" TEXT NOT NULL,
    "grantedByProfileId" TEXT NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "team_category_levels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "playoff_series" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "round" "PlayoffRound" NOT NULL,
    "bracketPosition" INTEGER NOT NULL,
    "format" "PlayoffFormat" NOT NULL,
    "homeTeamId" TEXT,
    "awayTeamId" TEXT,
    "feedsFromSeriesAId" TEXT,
    "feedsFromSeriesBId" TEXT,
    "winnerTeamId" TEXT,
    "status" "PlayoffSeriesStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "playoff_series_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "playoff_series_matches" (
    "id" TEXT NOT NULL,
    "seriesId" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,

    CONSTRAINT "playoff_series_matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "friendlies" (
    "id" TEXT NOT NULL,
    "sportId" TEXT NOT NULL,
    "modality" TEXT NOT NULL,
    "homeTeamId" TEXT NOT NULL,
    "awayTeamId" TEXT NOT NULL,
    "proposedDate" TIMESTAMP(3) NOT NULL,
    "venueId" TEXT,
    "status" "FriendlyStatus" NOT NULL DEFAULT 'REQUESTED',
    "notes" TEXT,
    "confirmationDeadline" TIMESTAMP(3),
    "resultingMatchId" TEXT,
    "observedForCategorization" BOOLEAN NOT NULL DEFAULT false,
    "createdByProfileId" TEXT NOT NULL,
    "generatedByProfileId" TEXT,
    "generatedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "cancellationReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "friendlies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "debts" (
    "id" TEXT NOT NULL,
    "type" "DebtType" NOT NULL,
    "status" "DebtStatus" NOT NULL DEFAULT 'APPROVED',
    "concept" TEXT NOT NULL,
    "originAmount" DECIMAL(12,2) NOT NULL,
    "currentBalance" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'ARS',
    "dueDate" TIMESTAMP(3) NOT NULL,
    "teamId" TEXT,
    "profileId" TEXT,
    "registrationId" TEXT,
    "matchId" TEXT,
    "friendlyId" TEXT,
    "sanctionId" TEXT,
    "parentDebtId" TEXT,
    "notes" TEXT,
    "metadata" JSONB,
    "createdByProfileId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "debts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "debt_audits" (
    "id" TEXT NOT NULL,
    "debtId" TEXT NOT NULL,
    "fromStatus" "DebtStatus" NOT NULL,
    "toStatus" "DebtStatus" NOT NULL,
    "reason" TEXT,
    "byProfileId" TEXT NOT NULL,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "debt_audits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "media_assets_uploadedByProfileId_idx" ON "media_assets"("uploadedByProfileId");

-- CreateIndex
CREATE INDEX "media_assets_category_idx" ON "media_assets"("category");

-- CreateIndex
CREATE INDEX "media_assets_scheduledDeletionAt_idx" ON "media_assets"("scheduledDeletionAt");

-- CreateIndex
CREATE INDEX "media_assets_deletedAt_idx" ON "media_assets"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "media_assets_bucket_storageKey_key" ON "media_assets"("bucket", "storageKey");

-- CreateIndex
CREATE INDEX "category_levels_sportId_rank_idx" ON "category_levels"("sportId", "rank");

-- CreateIndex
CREATE UNIQUE INDEX "category_levels_sportId_code_key" ON "category_levels"("sportId", "code");

-- CreateIndex
CREATE INDEX "team_category_levels_teamId_idx" ON "team_category_levels"("teamId");

-- CreateIndex
CREATE UNIQUE INDEX "team_category_levels_teamId_categoryLevelId_key" ON "team_category_levels"("teamId", "categoryLevelId");

-- CreateIndex
CREATE INDEX "playoff_series_categoryId_idx" ON "playoff_series"("categoryId");

-- CreateIndex
CREATE INDEX "playoff_series_status_idx" ON "playoff_series"("status");

-- CreateIndex
CREATE UNIQUE INDEX "playoff_series_categoryId_round_bracketPosition_key" ON "playoff_series"("categoryId", "round", "bracketPosition");

-- CreateIndex
CREATE UNIQUE INDEX "playoff_series_matches_matchId_key" ON "playoff_series_matches"("matchId");

-- CreateIndex
CREATE INDEX "playoff_series_matches_seriesId_idx" ON "playoff_series_matches"("seriesId");

-- CreateIndex
CREATE UNIQUE INDEX "friendlies_resultingMatchId_key" ON "friendlies"("resultingMatchId");

-- CreateIndex
CREATE INDEX "friendlies_homeTeamId_idx" ON "friendlies"("homeTeamId");

-- CreateIndex
CREATE INDEX "friendlies_awayTeamId_idx" ON "friendlies"("awayTeamId");

-- CreateIndex
CREATE INDEX "friendlies_status_idx" ON "friendlies"("status");

-- CreateIndex
CREATE INDEX "friendlies_proposedDate_idx" ON "friendlies"("proposedDate");

-- CreateIndex
CREATE INDEX "debts_teamId_idx" ON "debts"("teamId");

-- CreateIndex
CREATE INDEX "debts_profileId_idx" ON "debts"("profileId");

-- CreateIndex
CREATE INDEX "debts_status_idx" ON "debts"("status");

-- CreateIndex
CREATE INDEX "debts_type_idx" ON "debts"("type");

-- CreateIndex
CREATE INDEX "debts_dueDate_idx" ON "debts"("dueDate");

-- CreateIndex
CREATE INDEX "debts_parentDebtId_idx" ON "debts"("parentDebtId");

-- CreateIndex
CREATE INDEX "debts_sanctionId_idx" ON "debts"("sanctionId");

-- CreateIndex
CREATE INDEX "debts_friendlyId_idx" ON "debts"("friendlyId");

-- CreateIndex
CREATE INDEX "debt_audits_debtId_idx" ON "debt_audits"("debtId");

-- CreateIndex
CREATE INDEX "debt_audits_byProfileId_idx" ON "debt_audits"("byProfileId");

-- CreateIndex
CREATE INDEX "categories_categoryLevelId_idx" ON "categories"("categoryLevelId");

-- CreateIndex
CREATE INDEX "matches_seriesId_idx" ON "matches"("seriesId");

-- CreateIndex
CREATE INDEX "payments_debtId_idx" ON "payments"("debtId");

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_avatarAssetId_fkey" FOREIGN KEY ("avatarAssetId") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_currentMedicalAssetId_fkey" FOREIGN KEY ("currentMedicalAssetId") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_currentSwornAssetId_fkey" FOREIGN KEY ("currentSwornAssetId") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_dniPhotoAssetId_fkey" FOREIGN KEY ("dniPhotoAssetId") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_uploadedByProfileId_fkey" FOREIGN KEY ("uploadedByProfileId") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_logoAssetId_fkey" FOREIGN KEY ("logoAssetId") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "category_levels" ADD CONSTRAINT "category_levels_sportId_fkey" FOREIGN KEY ("sportId") REFERENCES "sports"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_category_levels" ADD CONSTRAINT "team_category_levels_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_category_levels" ADD CONSTRAINT "team_category_levels_categoryLevelId_fkey" FOREIGN KEY ("categoryLevelId") REFERENCES "category_levels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_category_levels" ADD CONSTRAINT "team_category_levels_grantedByProfileId_fkey" FOREIGN KEY ("grantedByProfileId") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_categoryLevelId_fkey" FOREIGN KEY ("categoryLevelId") REFERENCES "category_levels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "playoff_series"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "playoff_series" ADD CONSTRAINT "playoff_series_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "playoff_series" ADD CONSTRAINT "playoff_series_homeTeamId_fkey" FOREIGN KEY ("homeTeamId") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "playoff_series" ADD CONSTRAINT "playoff_series_awayTeamId_fkey" FOREIGN KEY ("awayTeamId") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "playoff_series" ADD CONSTRAINT "playoff_series_feedsFromSeriesAId_fkey" FOREIGN KEY ("feedsFromSeriesAId") REFERENCES "playoff_series"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "playoff_series" ADD CONSTRAINT "playoff_series_feedsFromSeriesBId_fkey" FOREIGN KEY ("feedsFromSeriesBId") REFERENCES "playoff_series"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "playoff_series" ADD CONSTRAINT "playoff_series_winnerTeamId_fkey" FOREIGN KEY ("winnerTeamId") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "playoff_series_matches" ADD CONSTRAINT "playoff_series_matches_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "playoff_series"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "friendlies" ADD CONSTRAINT "friendlies_sportId_fkey" FOREIGN KEY ("sportId") REFERENCES "sports"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "friendlies" ADD CONSTRAINT "friendlies_homeTeamId_fkey" FOREIGN KEY ("homeTeamId") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "friendlies" ADD CONSTRAINT "friendlies_awayTeamId_fkey" FOREIGN KEY ("awayTeamId") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "friendlies" ADD CONSTRAINT "friendlies_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "venues"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "friendlies" ADD CONSTRAINT "friendlies_resultingMatchId_fkey" FOREIGN KEY ("resultingMatchId") REFERENCES "matches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "friendlies" ADD CONSTRAINT "friendlies_createdByProfileId_fkey" FOREIGN KEY ("createdByProfileId") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "friendlies" ADD CONSTRAINT "friendlies_generatedByProfileId_fkey" FOREIGN KEY ("generatedByProfileId") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "debts" ADD CONSTRAINT "debts_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "debts" ADD CONSTRAINT "debts_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "debts" ADD CONSTRAINT "debts_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "registrations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "debts" ADD CONSTRAINT "debts_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "matches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "debts" ADD CONSTRAINT "debts_friendlyId_fkey" FOREIGN KEY ("friendlyId") REFERENCES "friendlies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "debts" ADD CONSTRAINT "debts_sanctionId_fkey" FOREIGN KEY ("sanctionId") REFERENCES "sanctions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "debts" ADD CONSTRAINT "debts_parentDebtId_fkey" FOREIGN KEY ("parentDebtId") REFERENCES "debts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "debts" ADD CONSTRAINT "debts_createdByProfileId_fkey" FOREIGN KEY ("createdByProfileId") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "debt_audits" ADD CONSTRAINT "debt_audits_debtId_fkey" FOREIGN KEY ("debtId") REFERENCES "debts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "debt_audits" ADD CONSTRAINT "debt_audits_byProfileId_fkey" FOREIGN KEY ("byProfileId") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_debtId_fkey" FOREIGN KEY ("debtId") REFERENCES "debts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

