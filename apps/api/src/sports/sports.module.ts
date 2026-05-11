import { Module } from '@nestjs/common';
import { SportsService } from './sports.service';
import { SPORT_REPOSITORY } from './application/ports/sport-repository.port';
import { CreateSportUseCase } from './application/use-cases/create-sport.use-case';
import { GetSportUseCase } from './application/use-cases/get-sport.use-case';
import { ListSportsUseCase } from './application/use-cases/list-sports.use-case';
import { RemoveSportUseCase } from './application/use-cases/remove-sport.use-case';
import { UpdateSportUseCase } from './application/use-cases/update-sport.use-case';
import { PrismaSportRepository } from './infrastructure/repositories/prisma-sport.repository';
import { SportsController } from './presentation/controllers/sports.controller';

@Module({
  controllers: [SportsController],
  providers: [
    SportsService,
    CreateSportUseCase,
    ListSportsUseCase,
    GetSportUseCase,
    UpdateSportUseCase,
    RemoveSportUseCase,
    { provide: SPORT_REPOSITORY, useClass: PrismaSportRepository },
  ],
  exports: [SportsService],
})
export class SportsModule {}
