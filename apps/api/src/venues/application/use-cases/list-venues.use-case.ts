import { Injectable } from '@nestjs/common';
import type { PaginationDto } from '@overtime-mono/shared';
import { VenuesService } from '../../venues.service';

@Injectable()
export class ListVenuesUseCase {
  constructor(private readonly legacy: VenuesService) {}

  async execute(paginationDto: PaginationDto, isActive?: boolean) {
    return this.legacy.findAll(paginationDto, isActive);
  }
}
