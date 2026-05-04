import { Inject, Injectable } from '@nestjs/common';
import { FriendlyStatus } from '@prisma/client';
import {
  FRIENDLY_REPOSITORY,
  FriendlyWithDeposits,
  IFriendlyRepository,
} from '../ports/friendly-repository.port';
import {
  FRIENDLY_CONTEXT,
  IFriendlyContext,
} from '../ports/friendly-context.port';

export interface ListFriendliesInput {
  /** Profile que ejecuta el listado. */
  callerProfileId: string;
  /** True si es admin — ve todos los amistosos. */
  isAdmin: boolean;
  teamId?: string;
  status?: FriendlyStatus;
  from?: Date;
  to?: Date;
  page?: number;
  limit?: number;
}

export interface ListFriendliesOutput {
  data: FriendlyWithDeposits[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Lista amistosos con filtros. Reglas de visibilidad:
 * - Admin: ve todos.
 * - Delegado: sólo ve amistosos donde alguno de sus equipos participe.
 */
@Injectable()
export class ListFriendliesUseCase {
  constructor(
    @Inject(FRIENDLY_REPOSITORY)
    private readonly repo: IFriendlyRepository,
    @Inject(FRIENDLY_CONTEXT)
    private readonly context: IFriendlyContext,
  ) {}

  async execute(input: ListFriendliesInput): Promise<ListFriendliesOutput> {
    const page = input.page ?? 1;
    const limit = input.limit ?? 20;

    let visibleTeamIds: string[] | undefined;
    if (!input.isAdmin) {
      visibleTeamIds = await this.context.findTeamsWhereDelegate(
        input.callerProfileId,
      );
      if (visibleTeamIds.length === 0) {
        // Delegado sin equipos — lista vacía.
        return {
          data: [],
          meta: { total: 0, page, limit, totalPages: 0 },
        };
      }
      if (input.teamId && !visibleTeamIds.includes(input.teamId)) {
        return {
          data: [],
          meta: { total: 0, page, limit, totalPages: 0 },
        };
      }
    }

    const { data, total } = await this.repo.list({
      teamId: input.teamId,
      statuses: input.status ? [input.status] : undefined,
      from: input.from,
      to: input.to,
      visibleTeamIds,
      page,
      limit,
    });

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: limit > 0 ? Math.ceil(total / limit) : 0,
      },
    };
  }
}
