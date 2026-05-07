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
  STATUS_CHANGE_FAILED: 'STATUS_CHANGE_FAILED',

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
  MATCH_STATS_UPSERT_FAILED: 'MATCH_STATS_UPSERT_FAILED',

  // ── Blacklist ───────────────────────────────────────────────────
  BLACKLIST_ADD_FAILED: 'BLACKLIST_ADD_FAILED',
  BLACKLIST_REMOVE_FAILED: 'BLACKLIST_REMOVE_FAILED',
  BLACKLIST_CHECK_FAILED: 'BLACKLIST_CHECK_FAILED',

  // ── Empleados ───────────────────────────────────────────────────
  EMPLOYEE_CREATE_FAILED: 'EMPLOYEE_CREATE_FAILED',
  EMPLOYEE_UPDATE_FAILED: 'EMPLOYEE_UPDATE_FAILED',
  EMPLOYEE_DELETE_FAILED: 'EMPLOYEE_DELETE_FAILED',

  // ── Jugadores (admin CRUD) ──────────────────────────────────────
  PLAYER_CREATE_FAILED: 'PLAYER_CREATE_FAILED',
  PLAYER_UPDATE_FAILED: 'PLAYER_UPDATE_FAILED',
  PLAYER_DELETE_FAILED: 'PLAYER_DELETE_FAILED',

  // ── Inscripciones ───────────────────────────────────────────────
  REGISTRATION_APPROVE_FAILED: 'REGISTRATION_APPROVE_FAILED',
  REGISTRATION_REJECT_FAILED: 'REGISTRATION_REJECT_FAILED',

  // ── Configuración del sitio ─────────────────────────────────────
  SITE_CONFIG_GENERAL_FAILED: 'SITE_CONFIG_GENERAL_FAILED',
  SITE_CONFIG_SOCIAL_FAILED: 'SITE_CONFIG_SOCIAL_FAILED',
  SITE_CONFIG_PAYMENT_FAILED: 'SITE_CONFIG_PAYMENT_FAILED',

  // ── Disciplinas ─────────────────────────────────────────────────
  SPORT_CREATE_FAILED: 'SPORT_CREATE_FAILED',
  SPORT_UPDATE_FAILED: 'SPORT_UPDATE_FAILED',
  SPORT_DELETE_FAILED: 'SPORT_DELETE_FAILED',

  // ── Torneos / categorías / zonas ────────────────────────────────
  TOURNAMENT_CREATE_FAILED: 'TOURNAMENT_CREATE_FAILED',
  TOURNAMENT_UPDATE_FAILED: 'TOURNAMENT_UPDATE_FAILED',
  TOURNAMENT_DELETE_FAILED: 'TOURNAMENT_DELETE_FAILED',
  CATEGORY_CREATE_FAILED: 'CATEGORY_CREATE_FAILED',
  CATEGORY_UPDATE_FAILED: 'CATEGORY_UPDATE_FAILED',
  CATEGORY_DELETE_FAILED: 'CATEGORY_DELETE_FAILED',
  ZONE_CREATE_FAILED: 'ZONE_CREATE_FAILED',
  ZONE_DELETE_FAILED: 'ZONE_DELETE_FAILED',
  ZONE_TEAM_ASSIGN_FAILED: 'ZONE_TEAM_ASSIGN_FAILED',
  ZONE_TEAM_REMOVE_FAILED: 'ZONE_TEAM_REMOVE_FAILED',
  ZONE_TEAM_MOVE_FAILED: 'ZONE_TEAM_MOVE_FAILED',
} as const

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode]
