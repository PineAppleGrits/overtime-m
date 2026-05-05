import { MediaAsset } from '@prisma/client';

/**
 * Datos mínimos del profile para los checks de elegibilidad.
 *
 * No exponemos la entidad Prisma cruda — sólo lo que necesita el dominio.
 */
export interface ProfileEligibilitySnapshot {
  id: string;
  documentNumber: string | null;
  /** Asset actual del apto médico, si está cargado. */
  currentMedicalAsset: MediaAsset | null;
  /** Asset actual de la DDJJ, si está cargada. */
  currentSwornAsset: MediaAsset | null;
}

export interface MatchScopeSnapshot {
  matchId: string;
  categoryId: string | null;
  tournamentId: string | null;
}

export interface TeamRosterSize {
  teamId: string;
  count: number;
}

/**
 * Inscripciones (RegistrationRosterEntry) activas del jugador en un torneo.
 * Usado para validar RN-007 / RN-038.
 */
export interface PlayerTournamentMembership {
  registrationId: string;
  teamId: string;
  categoryId: string;
}

export interface IEligibilityRepository {
  /** Lee el profile + assets actuales (medical + sworn). 404 si no existe. */
  getProfileSnapshot(profileId: string): Promise<ProfileEligibilitySnapshot | null>;

  /** Devuelve scope (categoryId/tournamentId) del partido. */
  getMatchScope(matchId: string): Promise<MatchScopeSnapshot | null>;

  /** Cuenta el roster activo del equipo (ProfileTeam.isActive=true). */
  countActiveRoster(teamId: string): Promise<number>;

  /** True si el equipo existe y no está soft-deleted. */
  teamExists(teamId: string): Promise<boolean>;

  /**
   * Inscripciones activas del jugador en el torneo. Excluye estados
   * `rechazada` / `cancelled`. Útil para RN-007 / RN-038.
   */
  findActiveRegistrationsForProfileInTournament(
    profileId: string,
    tournamentId: string,
  ): Promise<PlayerTournamentMembership[]>;

  /**
   * True si el equipo está en el roster del partido (jugó o estaba listado).
   * Usado por la sanción para sumar fecha cumplida.
   */
  isProfileInMatchRoster(matchId: string, profileId: string): Promise<boolean>;

  /** Modalidad+sport del partido para resolver SportRules en team-eligibility. */
  getMatchSportContext(matchId: string): Promise<{
    sportCode: string;
    modality: string;
  } | null>;
}

export const ELIGIBILITY_REPOSITORY = Symbol('ELIGIBILITY_REPOSITORY');
