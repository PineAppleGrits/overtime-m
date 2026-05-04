import { Inject, Injectable } from '@nestjs/common';
import { DebtStatus, DebtType } from '@prisma/client';
import {
  DEBT_REPOSITORY,
  DebtWithRelations,
  IDebtRepository,
} from '../ports/debt-repository.port';
import {
  DEBT_CONTEXT,
  IDebtContext,
} from '../ports/debt-context.port';

export interface ListDebtsInput {
  callerProfileId: string;
  isAdmin: boolean;
  teamId?: string;
  profileId?: string;
  status?: DebtStatus;
  type?: DebtType;
  from?: Date;
  to?: Date;
  overdueOnly?: boolean;
  page?: number;
  limit?: number;
}

export interface ListDebtsOutput {
  data: DebtWithRelations[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Listado paginado de deudas (admin ve todas; usuario ve solo las suyas:
 * `profileId === callerProfileId` OR `teamId in callerTeams`).
 */
@Injectable()
export class ListDebtsUseCase {
  constructor(
    @Inject(DEBT_REPOSITORY)
    private readonly repo: IDebtRepository,
    @Inject(DEBT_CONTEXT)
    private readonly context: IDebtContext,
  ) {}

  async execute(input: ListDebtsInput): Promise<ListDebtsOutput> {
    const page = input.page ?? 1;
    const limit = input.limit ?? 20;

    let visibleTeamIds: string[] | undefined;
    let visibleProfileId: string | undefined;

    if (!input.isAdmin) {
      visibleTeamIds = await this.context.findTeamIdsForProfile(
        input.callerProfileId,
      );
      visibleProfileId = input.callerProfileId;
    }

    const result = await this.repo.list({
      teamId: input.teamId,
      profileId: input.profileId,
      status: input.status,
      type: input.type,
      from: input.from,
      to: input.to,
      overdueOnly: input.overdueOnly,
      visibleTeamIds,
      visibleProfileId,
      page,
      limit,
    });

    return {
      data: result.data,
      total: result.total,
      page,
      limit,
    };
  }
}
