import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { FixturesModule } from '../fixtures/fixtures.module';
import { PLAYOFF_REPOSITORY } from './application/ports/playoff-repository.port';
import { PrismaPlayoffRepository } from './infrastructure/repositories/prisma-playoff.repository';
import { GenerateBracketUseCase } from './application/use-cases/generate-bracket.use-case';
import { OverrideBracketSeriesUseCase } from './application/use-cases/override-bracket-series.use-case';
import { AdvanceOnWinnerUseCase } from './application/use-cases/advance-on-winner.use-case';
import { ResolveTiebreakerUseCase } from './application/use-cases/resolve-tiebreaker.use-case';
import { GeneratePromotionPlayoffUseCase } from './application/use-cases/generate-promotion-playoff.use-case';
import { PlayoffMatchFinishedListener } from './infrastructure/listeners/match-finished.listener';
import { PlayoffsController } from './presentation/controllers/playoffs.controller';

/**
 * W3.1 — módulo de playoffs.
 *
 * - Bracket generation (auto + manual override).
 * - Advance-on-winner (listener de `match.finished`).
 * - Tiebreaker manual BO1 0-0 (RN-024).
 * - Repechaje RN-058 (DP-005 abierto).
 *
 * Lee standings vía `FixturesModule.StandingsService`.
 */
@Module({
  imports: [DatabaseModule, FixturesModule],
  controllers: [PlayoffsController],
  providers: [
    GenerateBracketUseCase,
    OverrideBracketSeriesUseCase,
    AdvanceOnWinnerUseCase,
    ResolveTiebreakerUseCase,
    GeneratePromotionPlayoffUseCase,
    PlayoffMatchFinishedListener,
    { provide: PLAYOFF_REPOSITORY, useClass: PrismaPlayoffRepository },
  ],
})
export class PlayoffsModule {}
