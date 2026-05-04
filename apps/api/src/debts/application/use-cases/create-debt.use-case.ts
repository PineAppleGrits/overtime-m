import { Injectable } from '@nestjs/common';
import { DebtType } from '@prisma/client';
import {
  CreateDebtInternalUseCase,
  CreateDebtInternalInput,
} from './create-debt-internal.use-case';
import { DebtWithRelations } from '../ports/debt-repository.port';

export interface CreateDebtAdminInput {
  type: DebtType;
  concept: string;
  originAmount: number;
  dueDate: Date;
  currency?: string;
  teamId?: string;
  profileId?: string;
  registrationId?: string;
  matchId?: string;
  friendlyId?: string;
  sanctionId?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
  createdByProfileId: string;
}

/**
 * Caso de uso del endpoint admin `POST /api/v1/debts`.
 *
 * Wrapper sobre `CreateDebtInternalUseCase` que mantiene la separación de
 * responsabilidades: el internal no asume admin, este endpoint sí (auth via
 * @Roles en el controller).
 */
@Injectable()
export class CreateDebtUseCase {
  constructor(
    private readonly internal: CreateDebtInternalUseCase,
  ) {}

  async execute(input: CreateDebtAdminInput): Promise<DebtWithRelations> {
    const internalInput: CreateDebtInternalInput = {
      type: input.type,
      concept: input.concept,
      originAmount: input.originAmount,
      dueDate: input.dueDate,
      currency: input.currency,
      teamId: input.teamId ?? null,
      profileId: input.profileId ?? null,
      registrationId: input.registrationId ?? null,
      matchId: input.matchId ?? null,
      friendlyId: input.friendlyId ?? null,
      sanctionId: input.sanctionId ?? null,
      notes: input.notes ?? null,
      metadata: input.metadata,
      createdByProfileId: input.createdByProfileId,
    };
    return this.internal.execute(internalInput);
  }
}
