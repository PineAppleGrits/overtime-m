/**
 * Códigos de error de la app — la fuente de verdad para identificar
 * qué falló en una server action / fetch. El mensaje user-facing vive
 * en `messages.ts` (un único lugar para editarlo).
 *
 * Convenciones:
 * - `SCREAMING_SNAKE_CASE`.
 * - Agrupados por dominio (auth, validation, teams, etc).
 * - Si vas a escribir un mensaje de error nuevo, primero fijate si ya
 *   hay uno equivalente acá; sólo agregás un código nuevo cuando el
 *   mensaje es genuinamente distinto.
 */
export const ErrorCode = {
  // ── Genéricos ────────────────────────────────────────────────────
  GENERIC: 'GENERIC',
  NETWORK: 'NETWORK',

  // ── Auth / autorización ──────────────────────────────────────────
  NOT_AUTHENTICATED: 'NOT_AUTHENTICATED',
  NOT_AUTHORIZED: 'NOT_AUTHORIZED',

  // ── Validación ──────────────────────────────────────────────────
  INVALID_INPUT: 'INVALID_INPUT',
  INVALID_ID: 'INVALID_ID',

  // ── Equipos / franquicias ───────────────────────────────────────
  TEAM_CREATE_FAILED: 'TEAM_CREATE_FAILED',
  TEAM_UPDATE_FAILED: 'TEAM_UPDATE_FAILED',
  TEAM_DELETE_FAILED: 'TEAM_DELETE_FAILED',
  TEAM_LEAVE_FAILED: 'TEAM_LEAVE_FAILED',
  ROSTER_ADD_FAILED: 'ROSTER_ADD_FAILED',
  ROSTER_REMOVE_FAILED: 'ROSTER_REMOVE_FAILED',
  FRANCHISE_CREATE_FAILED: 'FRANCHISE_CREATE_FAILED',

  // ── Partidos ────────────────────────────────────────────────────
  MATCH_SCORE_UPDATE_FAILED: 'MATCH_SCORE_UPDATE_FAILED',
  MATCH_STATUS_CHANGE_FAILED: 'MATCH_STATUS_CHANGE_FAILED',
} as const

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode]
