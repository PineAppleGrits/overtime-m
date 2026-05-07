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
