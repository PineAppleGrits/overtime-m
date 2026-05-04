/**
 * Port hacia datos del Match necesarios para crear la carpeta Drive
 * (RN-051) y emitir comunicados (`MatchAnnouncement`).
 *
 * Se mantiene mínimo para no acoplar W3.2 al módulo `matches` (W3.1).
 */
export interface MatchPhotoFolderContext {
  matchId: string;
  matchDate: Date;
  matchTime: string | null;
  homeTeamSlug: string | null;
  awayTeamSlug: string | null;
  homeTeamName: string | null;
  awayTeamName: string | null;
  categorySlug: string | null;
  categoryName: string | null;
  tournamentSlug: string | null;
  tournamentName: string | null;
  /**
   * StaffId del fotógrafo asignado en estado activo (assigned/applied).
   * Útil para los listeners que crean folder solo si hay multimedia.
   */
  photographerStaffId: string | null;
}

export interface CreateAnnouncementInput {
  matchId: string;
  type: string; // ej: 'photo_folder_created'
  title: string;
  message: string;
  createdByProfileId: string;
}

export interface IMatchContextPort {
  /** Devuelve el contexto del match o null si no existe / fue borrado. */
  getMatchPhotoFolderContext(
    matchId: string,
  ): Promise<MatchPhotoFolderContext | null>;

  createAnnouncement(input: CreateAnnouncementInput): Promise<void>;
}

export const MATCH_CONTEXT_PORT = Symbol('MATCH_CONTEXT_PORT');
