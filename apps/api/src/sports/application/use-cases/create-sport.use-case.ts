import { ConflictException, Inject, Injectable, Logger } from '@nestjs/common';
import type { CreateSportDto } from '@overtime-mono/shared';
import {
  ISportRepository,
  SPORT_REPOSITORY,
} from '../ports/sport-repository.port';

@Injectable()
export class CreateSportUseCase {
  private readonly logger = new Logger(CreateSportUseCase.name);

  constructor(
    @Inject(SPORT_REPOSITORY)
    private readonly sports: ISportRepository,
  ) {}

  async execute(createSportDto: CreateSportDto) {
    const existingCode = await this.sports.findByCode(createSportDto.code);
    if (existingCode) {
      throw new ConflictException('Sport code already exists');
    }

    const existingName = await this.sports.findByName(createSportDto.name);
    if (existingName) {
      throw new ConflictException('Sport name already exists');
    }

    const sport = await this.sports.create(createSportDto);
    this.logger.log(`Sport created: ${sport.name}`);
    return sport;
  }
}
