export const MIN_INITIAL_ROSTER = 8;
export const MAX_TOTAL_ROSTER = 25;
export const MAX_ADDITIONS = 5;
export const PLAYOFF_CUTOFF_REMAINING_MATCHES = 3;

export const ACTIVE_REGISTRATION_STATUSES = ['pendiente', 'aprobada'] as const;
export const EDITABLE_REGISTRATION_STATUSES = [
  'pendiente',
  'aprobada',
] as const;
export const NON_FINISHED_MATCH_STATUSES = [
  'programado',
  'en_curso',
  'suspendido',
  'reprogramado',
] as const;
