import { Module, forwardRef } from '@nestjs/common';
import { FixturesController } from './fixtures.controller';
import { FixturesService } from './fixtures.service';
import { StandingsService } from './generators/standings.service';
import { PlayoffGenerator } from './generators/playoff.generator';
import { DatabaseModule } from '../database/database.module';
import { MatchesModule } from '../matches/matches.module';

@Module({
  imports: [DatabaseModule, forwardRef(() => MatchesModule)],
  controllers: [FixturesController],
  providers: [FixturesService, StandingsService, PlayoffGenerator],
  exports: [FixturesService, StandingsService, PlayoffGenerator],
})
export class FixturesModule {}
