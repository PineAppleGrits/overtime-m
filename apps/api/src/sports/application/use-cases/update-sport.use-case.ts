import { ConflictException, Inject, Injectable, Logger } from '@nestjs/common';
import type { UpdateSportDto } from '@overtime-mono/shared';
import {
  ISportRepository,
  SPORT_REPOSITORY,
} from '../ports/sport-repository.port';
import { GetSportUseCase } from './get-sport.use-case';

@Injectable()
export class UpdateSportUseCase {
  private readonly logger = new Logger(UpdateSportUseCase.name);

  constructor(
    @Inject(SPORT_REPOSITORY)
    private readonly sports: ISportRepository,
    private readonly getSport: GetSportUseCase,
  ) {}

  async execute(id: string, updateSportDto: UpdateSportDto) {
    await this.getSport.execute(id);

    if (updateSportDto.code) {
      const existingCode = await this.sports.findByCode(updateSportDto.code);
      if (existingCode && existingCode.id !== id) {
        throw new ConflictException('Sport code already exists');
      }
    }

    if (updateSportDto.name) {
      const existingName = await this.sports.findByName(updateSportDto.name);
      if (existingName && existingName.id !== id) {
        throw new ConflictException('Sport name already exists');
      }
    }

    const sport = await this.sports.update(id, updateSportDto);
    this.logger.log(`Sport updated: ${sport.name}`);
    return sport;
  }
}
