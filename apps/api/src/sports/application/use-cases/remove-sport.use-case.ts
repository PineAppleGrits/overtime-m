import { ConflictException, Inject, Injectable, Logger } from '@nestjs/common';
import {
  ISportRepository,
  SPORT_REPOSITORY,
} from '../ports/sport-repository.port';
import { GetSportUseCase } from './get-sport.use-case';

@Injectable()
export class RemoveSportUseCase {
  private readonly logger = new Logger(RemoveSportUseCase.name);

  constructor(
    @Inject(SPORT_REPOSITORY)
    private readonly sports: ISportRepository,
    private readonly getSport: GetSportUseCase,
  ) {}

  async execute(id: string) {
    await this.getSport.execute(id);

    const teamsCount = await this.sports.countTeams(id);
    if (teamsCount > 0) {
      throw new ConflictException('Cannot delete sport with associated teams');
    }

    const tournamentsCount = await this.sports.countTournaments(id);
    if (tournamentsCount > 0) {
      throw new ConflictException(
        'Cannot delete sport with associated tournaments',
      );
    }

    await this.sports.delete(id);
    this.logger.log(`Sport deleted: ${id}`);
    return { message: 'Sport deleted successfully' };
  }
}
