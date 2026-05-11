import { Module } from '@nestjs/common';
import { FixturesController } from './fixtures.controller';
import { FixturesService } from './fixtures.service';
import { StandingsService } from './generators/standings.service';
import { DatabaseModule } from '../database/database.module';
import { CompleteRegularPhaseUseCase } from './application/use-cases/complete-regular-phase.use-case';
import { GetStandingsUseCase } from './application/use-cases/get-standings.use-case';
import { FixturesFacadeService } from './application/services/fixtures-facade.service';

@Module({
  imports: [DatabaseModule],
  controllers: [FixturesController],
  providers: [
    FixturesService,
    StandingsService,
    FixturesFacadeService,
    GetStandingsUseCase,
    CompleteRegularPhaseUseCase,
  ],
  exports: [FixturesService, FixturesFacadeService, StandingsService],
})
export class FixturesModule {}
