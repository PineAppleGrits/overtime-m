import { Module } from '@nestjs/common';
import { ZonesService } from './zones.service';
import { ZonesController } from './zones.controller';
import { DatabaseModule } from '../../database/database.module';
import { AutoBalanceTeamsUseCase } from './application/use-cases/auto-balance-teams.use-case';

@Module({
  imports: [DatabaseModule],
  controllers: [ZonesController],
  providers: [ZonesService, AutoBalanceTeamsUseCase],
  exports: [ZonesService, AutoBalanceTeamsUseCase],
})
export class ZonesModule {}
