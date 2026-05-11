import { Inject, Injectable } from '@nestjs/common';
import {
  ISportRepository,
  SPORT_REPOSITORY,
} from '../ports/sport-repository.port';

@Injectable()
export class ListSportsUseCase {
  constructor(
    @Inject(SPORT_REPOSITORY)
    private readonly sports: ISportRepository,
  ) {}

  async execute() {
    return this.sports.findAll();
  }
}
