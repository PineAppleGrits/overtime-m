import { Inject, Injectable } from '@nestjs/common';
import { ProfileRole } from '@prisma/client';
import {
  IProfileRepository,
  PROFILE_REPOSITORY,
  ProfileListResult,
} from '../ports/profile-repository.port';

export interface ListUsersInput {
  search?: string;
  roles?: ProfileRole[];
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'email' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

@Injectable()
export class ListUsersUseCase {
  constructor(
    @Inject(PROFILE_REPOSITORY)
    private readonly repo: IProfileRepository,
  ) {}

  async execute(input: ListUsersInput): Promise<ProfileListResult> {
    return this.repo.list({
      search: input.search,
      roles: input.roles,
      page: input.page ?? 1,
      limit: input.limit ?? 10,
      sortBy: input.sortBy ?? 'name',
      sortOrder: input.sortOrder ?? 'asc',
    });
  }
}
