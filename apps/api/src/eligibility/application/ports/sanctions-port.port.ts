import { SanctionLike } from '../../domain/rules/active-suspension.rules';

/**
 * Port hacia el módulo Sanctions desde Eligibility.
 *
 * Eligibility consume sanciones para detectar suspensiones activas. NO crea
 * sanciones — el módulo Sanctions es el dueño de la escritura.
 */

export interface BlacklistEntryLike {
  id: string;
  reason: string;
  documentNumber: string;
  profileId: string | null;
}

export interface IEligibilitySanctionsPort {
  /** Sanciones activas del profile. Devuelve también las globales. */
  findActiveSanctionsForProfile(profileId: string): Promise<SanctionLike[]>;

  /** Sanciones activas del equipo. Devuelve también las globales. */
  findActiveSanctionsForTeam(teamId: string): Promise<SanctionLike[]>;

  /** Blacklists activas para profileId / documentNumber. */
  findActiveBlacklistsFor(params: {
    profileId?: string;
    documentNumber?: string | null;
  }): Promise<BlacklistEntryLike[]>;
}

export const ELIGIBILITY_SANCTIONS_PORT = Symbol('ELIGIBILITY_SANCTIONS_PORT');
