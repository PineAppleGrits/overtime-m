import type { Sport } from '@prisma/client';
import type { CreateSportDto, UpdateSportDto } from '@overtime-mono/shared';

export const SPORT_REPOSITORY = Symbol('SPORT_REPOSITORY');

export type SportWithRelations = Sport & {
  teams?: Array<{
    id: string;
    name: string;
    logoUrl: string | null;
  }>;
  tournaments?: Array<{
    id: string;
    name: string;
    status: string;
  }>;
};

export interface ISportRepository {
  create(data: CreateSportDto): Promise<Sport>;
  findAll(): Promise<Sport[]>;
  findById(id: string): Promise<SportWithRelations | null>;
  findByCode(code: string): Promise<Sport | null>;
  findByName(name: string): Promise<Sport | null>;
  update(id: string, data: UpdateSportDto): Promise<Sport>;
  delete(id: string): Promise<void>;
  countTeams(id: string): Promise<number>;
  countTournaments(id: string): Promise<number>;
}
