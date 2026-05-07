import { ErrorCode } from './codes'

/**
 * Mensajes user-facing en español rioplatense, indexados por `ErrorCode`.
 * El `Record<ErrorCode, string>` fuerza a TS a verificar que cubrimos
 * todos los códigos — si agregás uno nuevo en `codes.ts` y olvidás el
 * mensaje, el build rompe acá.
 */
export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  [ErrorCode.GENERIC]: 'Ocurrió un error inesperado',
  [ErrorCode.NETWORK]: 'No pudimos conectar con el servidor',
  [ErrorCode.STATUS_CHANGE_FAILED]: 'No se pudo cambiar el estado',

  [ErrorCode.NOT_AUTHENTICATED]: 'Tenés que iniciar sesión para hacer esto',
  [ErrorCode.NOT_AUTHORIZED]: 'No tenés permisos para esta acción',

  [ErrorCode.INVALID_INPUT]: 'Los datos ingresados no son válidos',
  [ErrorCode.INVALID_ID]: 'El identificador no es válido',

  [ErrorCode.TEAM_CREATE_FAILED]: 'No se pudo crear el equipo',
  [ErrorCode.TEAM_UPDATE_FAILED]: 'No se pudo actualizar el equipo',
  [ErrorCode.TEAM_DELETE_FAILED]: 'No se pudo eliminar el equipo',
  [ErrorCode.TEAM_LEAVE_FAILED]: 'No se pudo abandonar el equipo',
  [ErrorCode.ROSTER_ADD_FAILED]: 'No se pudo agregar al jugador al equipo',
  [ErrorCode.ROSTER_REMOVE_FAILED]: 'No se pudo quitar al jugador del equipo',
  [ErrorCode.FRANCHISE_CREATE_FAILED]: 'No se pudo crear la franquicia',

  [ErrorCode.MATCH_SCORE_UPDATE_FAILED]: 'No se pudo actualizar el marcador',
  [ErrorCode.MATCH_STATUS_CHANGE_FAILED]: 'No se pudo cambiar el estado del partido',

  [ErrorCode.BLACKLIST_ADD_FAILED]: 'No se pudo agregar a la lista negra',
  [ErrorCode.BLACKLIST_REMOVE_FAILED]: 'No se pudo eliminar de la lista negra',
  [ErrorCode.BLACKLIST_CHECK_FAILED]: 'No se pudo verificar el estado del jugador',

  [ErrorCode.EMPLOYEE_CREATE_FAILED]: 'No se pudo crear el empleado',
  [ErrorCode.EMPLOYEE_UPDATE_FAILED]: 'No se pudo actualizar el empleado',
  [ErrorCode.EMPLOYEE_DELETE_FAILED]: 'No se pudo eliminar el empleado',

  [ErrorCode.PLAYER_CREATE_FAILED]: 'No se pudo crear el jugador',
  [ErrorCode.PLAYER_UPDATE_FAILED]: 'No se pudo actualizar el jugador',
  [ErrorCode.PLAYER_DELETE_FAILED]: 'No se pudo eliminar el jugador',

  [ErrorCode.REGISTRATION_APPROVE_FAILED]: 'No se pudo aprobar la inscripción',
  [ErrorCode.REGISTRATION_REJECT_FAILED]: 'No se pudo rechazar la inscripción',

  [ErrorCode.SITE_CONFIG_GENERAL_FAILED]: 'No se pudo guardar la configuración',
  [ErrorCode.SITE_CONFIG_SOCIAL_FAILED]: 'No se pudo guardar las redes sociales',
  [ErrorCode.SITE_CONFIG_PAYMENT_FAILED]: 'No se pudo guardar la configuración de pagos',

  [ErrorCode.SPORT_CREATE_FAILED]: 'No se pudo crear la disciplina',
  [ErrorCode.SPORT_UPDATE_FAILED]: 'No se pudo actualizar la disciplina',
  [ErrorCode.SPORT_DELETE_FAILED]: 'No se pudo eliminar la disciplina',

  [ErrorCode.TOURNAMENT_CREATE_FAILED]: 'No se pudo crear el torneo',
  [ErrorCode.TOURNAMENT_UPDATE_FAILED]: 'No se pudo actualizar el torneo',
  [ErrorCode.TOURNAMENT_DELETE_FAILED]: 'No se pudo eliminar el torneo',
  [ErrorCode.CATEGORY_CREATE_FAILED]: 'No se pudo crear la categoría',
  [ErrorCode.CATEGORY_UPDATE_FAILED]: 'No se pudo actualizar la categoría',
  [ErrorCode.CATEGORY_DELETE_FAILED]: 'No se pudo eliminar la categoría',
  [ErrorCode.ZONE_CREATE_FAILED]: 'No se pudo crear la zona',
  [ErrorCode.ZONE_DELETE_FAILED]: 'No se pudo eliminar la zona',
  [ErrorCode.ZONE_TEAM_ASSIGN_FAILED]: 'No se pudo asignar el equipo a la zona',
  [ErrorCode.ZONE_TEAM_REMOVE_FAILED]: 'No se pudo remover el equipo de la zona',
  [ErrorCode.ZONE_TEAM_MOVE_FAILED]: 'No se pudo mover el equipo',
}

/**
 * Devuelve el mensaje user-facing para un código.
 *
 * - Si `code` es un `ErrorCode` conocido, retorna su mensaje.
 * - Si es un string libre (legacy / mensaje crudo del backend), lo
 *   devuelve tal cual — útil durante la migración para no romper código
 *   que todavía pase strings directos a `toast.error`.
 * - Si es `null/undefined`, devuelve `fallback` o el mensaje genérico.
 */
export function getErrorMessage(
  code: ErrorCode | string | null | undefined,
  fallback?: string,
): string {
  if (!code) return fallback ?? ERROR_MESSAGES[ErrorCode.GENERIC]
  if (Object.prototype.hasOwnProperty.call(ERROR_MESSAGES, code)) {
    return ERROR_MESSAGES[code as ErrorCode]
  }
  return fallback ?? code
}

/**
 * Helper para construir el shape de error de una server action.
 * Compatible con `ActionResult<T>` (apps/web/modules/admin/actions/types.ts).
 *
 * Uso:
 * ```ts
 * if (!profile) return actionFailure(ErrorCode.NOT_AUTHENTICATED)
 * ```
 */
export function actionFailure(
  code: ErrorCode,
  override?: string,
): { success: false; error: string } {
  return { success: false, error: override ?? ERROR_MESSAGES[code] }
}
