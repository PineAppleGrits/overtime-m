import { Module } from '@nestjs/common';
import { FixturesController } from './fixtures.controller';
import { FixturesService } from './fixtures.service';
import { StandingsService } from './generators/standings.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [FixturesController],
  providers: [FixturesService, StandingsService],
  exports: [FixturesService, StandingsService],
})
export class FixturesModule {}
