import { Module } from '@nestjs/common';
import { MatchesService } from './matches.service';
import { MatchesController } from './matches.controller';
import { DatabaseModule } from '../database/database.module';
import { EligibilityModule } from '../eligibility/eligibility.module';
import { VenuesModule } from '../venues/venues.module';

@Module({
  imports: [DatabaseModule, VenuesModule, EligibilityModule],
  controllers: [MatchesController],
  providers: [MatchesService],
  exports: [MatchesService],
})
export class MatchesModule {}
