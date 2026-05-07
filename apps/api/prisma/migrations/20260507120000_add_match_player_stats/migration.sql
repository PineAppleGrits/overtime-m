-- BE-MOCK-005 — MatchPlayerStat model
-- Stats individuales por jugador y partido. Carga manual por admin/oficial_de_mesa.
-- `points` es denormalizado (= pt1 + 2*pt2 + 3*pt3) para evitar recomputar en agregaciones.

-- CreateTable
CREATE TABLE "match_player_stats" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "pt1" INTEGER NOT NULL DEFAULT 0,
    "pt1Att" INTEGER NOT NULL DEFAULT 0,
    "pt2" INTEGER NOT NULL DEFAULT 0,
    "pt2Att" INTEGER NOT NULL DEFAULT 0,
    "pt3" INTEGER NOT NULL DEFAULT 0,
    "pt3Att" INTEGER NOT NULL DEFAULT 0,
    "fouls" INTEGER NOT NULL DEFAULT 0,
    "steals" INTEGER NOT NULL DEFAULT 0,
    "rebounds" INTEGER NOT NULL DEFAULT 0,
    "assists" INTEGER NOT NULL DEFAULT 0,
    "turnovers" INTEGER NOT NULL DEFAULT 0,
    "blocks" INTEGER NOT NULL DEFAULT 0,
    "points" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdByProfileId" TEXT,

    CONSTRAINT "match_player_stats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "match_player_stats_profileId_idx" ON "match_player_stats"("profileId");

-- CreateIndex
CREATE INDEX "match_player_stats_teamId_idx" ON "match_player_stats"("teamId");

-- CreateIndex
CREATE INDEX "match_player_stats_matchId_idx" ON "match_player_stats"("matchId");

-- CreateIndex
CREATE UNIQUE INDEX "match_player_stats_matchId_profileId_key" ON "match_player_stats"("matchId", "profileId");

-- AddForeignKey
ALTER TABLE "match_player_stats" ADD CONSTRAINT "match_player_stats_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "matches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_player_stats" ADD CONSTRAINT "match_player_stats_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_player_stats" ADD CONSTRAINT "match_player_stats_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_player_stats" ADD CONSTRAINT "match_player_stats_createdByProfileId_fkey" FOREIGN KEY ("createdByProfileId") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
