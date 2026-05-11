import { Injectable } from '@nestjs/common';
import type { CreateFranchiseSchemaDto } from '@overtime-mono/shared';
import { CreateFranchiseUseCase } from '../use-cases/create-franchise.use-case';
import { FindMyFranchisesUseCase } from '../use-cases/find-my-franchises.use-case';
import { GetFranchiseUseCase } from '../use-cases/get-franchise.use-case';

@Injectable()
export class FranchisesService {
  constructor(
    private readonly createFranchise: CreateFranchiseUseCase,
    private readonly findMyFranchises: FindMyFranchisesUseCase,
    private readonly getFranchise: GetFranchiseUseCase,
  ) {}

  async create(dto: CreateFranchiseSchemaDto, ownerId: string) {
    return this.createFranchise.execute(dto, ownerId);
  }

  async findMine(ownerId: string) {
    return this.findMyFranchises.execute(ownerId);
  }

  async findOne(id: string) {
    return this.getFranchise.execute(id);
  }
}
