import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  ISportRepository,
  SPORT_REPOSITORY,
} from '../ports/sport-repository.port';

@Injectable()
export class GetSportUseCase {
  constructor(
    @Inject(SPORT_REPOSITORY)
    private readonly sports: ISportRepository,
  ) {}

  async execute(id: string) {
    const sport = await this.sports.findById(id);
    if (!sport) {
      throw new NotFoundException(`Sport with ID ${id} not found`);
    }

    return sport;
  }
}
