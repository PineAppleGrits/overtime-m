import { Module } from '@nestjs/common';
import { FranchisesService } from './franchises.service';
import { FranchisesController } from './franchises.controller';
import { FRANCHISE_REPOSITORY } from './application/ports/franchise-repository.port';
import { CreateFranchiseUseCase } from './application/use-cases/create-franchise.use-case';
import { FindMyFranchisesUseCase } from './application/use-cases/find-my-franchises.use-case';
import { GetFranchiseUseCase } from './application/use-cases/get-franchise.use-case';
import { PrismaFranchiseRepository } from './infrastructure/repositories/prisma-franchise.repository';

@Module({
  controllers: [FranchisesController],
  providers: [
    FranchisesService,
    CreateFranchiseUseCase,
    FindMyFranchisesUseCase,
    GetFranchiseUseCase,
    { provide: FRANCHISE_REPOSITORY, useClass: PrismaFranchiseRepository },
  ],
  exports: [FranchisesService],
})
export class FranchisesModule {}
