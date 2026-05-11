import { Module } from '@nestjs/common';
import { StandingsService } from './generators/standings.service';
import { DatabaseModule } from '../database/database.module';
import { FixturesService } from './application/services/fixtures.service';
import { CompleteRegularPhaseUseCase } from './application/use-cases/complete-regular-phase.use-case';
import { GetStandingsUseCase } from './application/use-cases/get-standings.use-case';
import { FixturesController } from './presentation/controllers/fixtures.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [FixturesController],
  providers: [
    FixturesService,
    StandingsService,
    GetStandingsUseCase,
    CompleteRegularPhaseUseCase,
  ],
  exports: [FixturesService, StandingsService],
})
export class FixturesModule {}
