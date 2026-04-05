import type {
  CreateTeamSchemaDto,
  UpdateTeamSchemaDto,
} from '@overtime-mono/shared/teams/contracts';

type TeamPayload = CreateTeamSchemaDto | UpdateTeamSchemaDto;

export function normalizeTeamPayload<T extends TeamPayload>(payload: T): T {
  const normalizedPayload = {
    ...payload,
    logoUrl: payload.logoUrl || undefined,
    captainId: payload.captainId || undefined,
  };

  if ('franchiseId' in payload) {
    return {
      ...normalizedPayload,
      franchiseId: payload.franchiseId || undefined,
    } as T;
  }

  return normalizedPayload as T;
}
