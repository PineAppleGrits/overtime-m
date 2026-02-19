import { Module, forwardRef } from '@nestjs/common';
import { MatchesService } from './matches.service';
import { MatchesController } from './matches.controller';
import { DatabaseModule } from '../database/database.module';
import { VenuesModule } from '../venues/venues.module';
import { FixturesModule } from '../fixtures/fixtures.module';

@Module({
  imports: [DatabaseModule, VenuesModule, forwardRef(() => FixturesModule)],
  controllers: [MatchesController],
  providers: [MatchesService],
  exports: [MatchesService],
})
export class MatchesModule {}
