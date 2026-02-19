import { Module } from '@nestjs/common';
import { TournamentsService } from './tournaments.service';
import { TournamentsController } from './tournaments.controller';
import { DatabaseModule } from '../database/database.module';
import { CategoriesModule } from './categories/categories.module';
import { ZonesModule } from './zones/zones.module';

@Module({
  imports: [DatabaseModule, CategoriesModule, ZonesModule],
  controllers: [TournamentsController],
  providers: [TournamentsService],
  exports: [TournamentsService],
})
export class TournamentsModule {}
