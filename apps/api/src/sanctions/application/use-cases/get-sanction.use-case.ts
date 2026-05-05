import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { BusinessError, ErrorCode } from '../../../common/errors';
import { Sanction } from '../../domain/entities/sanction.entity';
import {
  ISanctionRepository,
  SANCTION_REPOSITORY,
} from '../ports/sanction-repository.port';

@Injectable()
export class GetSanctionUseCase {
  constructor(
    @Inject(SANCTION_REPOSITORY)
    private readonly repo: ISanctionRepository,
  ) {}

  async execute(id: string): Promise<Sanction> {
    const sanction = await this.repo.findById(id);
    if (!sanction) {
      throw new BusinessError(
        ErrorCode.SANCTION_NOT_FOUND,
        'Sanción no encontrada',
        HttpStatus.NOT_FOUND,
        { sanctionId: id },
      );
    }
    return sanction;
  }
}
