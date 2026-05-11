import { Injectable } from '@nestjs/common';
import type { CreateSportDto, UpdateSportDto } from '@overtime-mono/shared';
import { CreateSportUseCase } from '../use-cases/create-sport.use-case';
import { GetSportUseCase } from '../use-cases/get-sport.use-case';
import { ListSportsUseCase } from '../use-cases/list-sports.use-case';
import { RemoveSportUseCase } from '../use-cases/remove-sport.use-case';
import { UpdateSportUseCase } from '../use-cases/update-sport.use-case';

@Injectable()
export class SportsService {
  constructor(
    private readonly createSport: CreateSportUseCase,
    private readonly listSports: ListSportsUseCase,
    private readonly getSport: GetSportUseCase,
    private readonly updateSport: UpdateSportUseCase,
    private readonly removeSport: RemoveSportUseCase,
  ) {}

  async create(createSportDto: CreateSportDto) {
    return this.createSport.execute(createSportDto);
  }

  async findAll() {
    return this.listSports.execute();
  }

  async findOne(id: string) {
    return this.getSport.execute(id);
  }

  async update(id: string, updateSportDto: UpdateSportDto) {
    return this.updateSport.execute(id, updateSportDto);
  }

  async remove(id: string) {
    return this.removeSport.execute(id);
  }
}
