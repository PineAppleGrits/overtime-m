import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { BusinessError, ErrorCode } from '../../../common/errors';
import {
  FRIENDLY_REPOSITORY,
  FriendlyWithDeposits,
  IFriendlyRepository,
} from '../ports/friendly-repository.port';
import {
  FRIENDLY_CONTEXT,
  IFriendlyContext,
} from '../ports/friendly-context.port';

export interface GetFriendlyInput {
  friendlyId: string;
  callerProfileId: string;
  isAdmin: boolean;
}

@Injectable()
export class GetFriendlyUseCase {
  constructor(
    @Inject(FRIENDLY_REPOSITORY)
    private readonly repo: IFriendlyRepository,
    @Inject(FRIENDLY_CONTEXT)
    private readonly context: IFriendlyContext,
  ) {}

  async execute(input: GetFriendlyInput): Promise<FriendlyWithDeposits> {
    const friendly = await this.repo.findById(input.friendlyId);
    if (!friendly) {
      throw new BusinessError(
        ErrorCode.NOT_FOUND,
        'Amistoso no encontrado',
        HttpStatus.NOT_FOUND,
        { friendlyId: input.friendlyId },
      );
    }

    if (input.isAdmin) {
      return friendly;
    }

    // Delegado: chequear que es delegado de uno de los dos equipos
    const visibleTeams = await this.context.findTeamsWhereDelegate(
      input.callerProfileId,
    );
    const hasAccess =
      visibleTeams.includes(friendly.homeTeamId) ||
      visibleTeams.includes(friendly.awayTeamId);
    if (!hasAccess) {
      throw new BusinessError(
        ErrorCode.FORBIDDEN,
        'No tenés permiso para ver este amistoso',
        HttpStatus.FORBIDDEN,
      );
    }

    return friendly;
  }
}
