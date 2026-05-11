import type { Franchise } from '@prisma/client';
import type { CreateFranchiseSchemaDto } from '@overtime-mono/shared';

export const FRANCHISE_REPOSITORY = Symbol('FRANCHISE_REPOSITORY');

export type FranchiseSummary = Pick<
  Franchise,
  'id' | 'name' | 'slug' | 'logoUrl' | 'ownerId' | 'createdAt'
>;

export type FranchiseMine = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  teams: Array<{
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
  }>;
};

export type FranchiseDetail = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  ownerId: string;
  teams: Array<{
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
    sport: {
      id: string;
      name: string;
      code: string;
      description: string | null;
      createdAt: Date;
      updatedAt: Date;
    };
  }>;
};

export interface IFranchiseRepository {
  create(data: {
    dto: CreateFranchiseSchemaDto;
    ownerId: string;
    slug: string;
  }): Promise<FranchiseSummary>;
  findMine(ownerId: string): Promise<FranchiseMine[]>;
  findOne(id: string): Promise<FranchiseDetail | null>;
  findBySlug(slug: string, excludeId?: string): Promise<Franchise | null>;
}
