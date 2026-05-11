import type { RegistrationRosterPlayerDto } from '@overtime-mono/shared';
import type { RegistrationResolvedPlayer } from './registration-repository.port';

export const REGISTRATION_ROSTER_CONTEXT_PORT = Symbol(
  'REGISTRATION_ROSTER_CONTEXT_PORT',
);

export interface RegistrationRosterContextPort {
  resolvePlayers(
    players: RegistrationRosterPlayerDto[],
  ): Promise<RegistrationResolvedPlayer[]>;
}

