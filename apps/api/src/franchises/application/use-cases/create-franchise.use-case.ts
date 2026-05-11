import { Inject, Injectable } from '@nestjs/common';
import type { CreateFranchiseSchemaDto } from '@overtime-mono/shared';
import { generateUniqueSlug } from '../../../common/utils/slug.util';
import {
  FRANCHISE_REPOSITORY,
  IFranchiseRepository,
} from '../ports/franchise-repository.port';

@Injectable()
export class CreateFranchiseUseCase {
  constructor(
    @Inject(FRANCHISE_REPOSITORY)
    private readonly franchises: IFranchiseRepository,
  ) {}

  async execute(dto: CreateFranchiseSchemaDto, ownerId: string) {
    const slug = await generateUniqueSlug({
      value: dto.name,
      exists: async (candidate) =>
        Boolean(await this.franchises.findBySlug(candidate)),
    });

    return this.franchises.create({ dto, ownerId, slug });
  }
}
