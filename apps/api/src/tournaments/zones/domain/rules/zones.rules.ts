/**
 * Reglas puras de validación para zonas dentro de una categoría.
 *
 * - RN-045 + DP-003: cantidad de zonas (máximo 2 en v1).
 * - "Un equipo solo puede estar en 1 zona dentro de la misma categoría".
 * - Auto-balance: distribución round-robin de equipos entre N zonas.
 */

/**
 * Valida si se puede crear una nueva zona dada la cantidad actual de zonas
 * existentes y el `zonesCount` configurado en la categoría.
 *
 * Retorna `null` si es válido o un mensaje de error en español.
 */
export function validateCanCreateZone(
  existingZonesCount: number,
  configuredZonesCount: number,
): string | null {
  if (existingZonesCount >= configuredZonesCount) {
    return `La categoría ya alcanzó su tope de zonas (${configuredZonesCount}).`;
  }
  return null;
}

/**
 * Verifica si un equipo está asignado a otra zona de la misma categoría.
 *
 * Recibe las asignaciones existentes del equipo (en formato simple para
 * facilitar el testeo) y la zona destino. Retorna `null` si la asignación
 * es válida o un mensaje en español si está duplicada.
 */
export interface TeamZoneAssignment {
  zoneId: string;
  categoryId: string;
}

export function validateTeamSingleZonePerCategory(
  existingAssignments: TeamZoneAssignment[],
  targetZoneId: string,
  targetCategoryId: string,
): string | null {
  for (const a of existingAssignments) {
    if (a.zoneId === targetZoneId) {
      return 'El equipo ya está asignado a esta zona.';
    }
    if (a.categoryId === targetCategoryId) {
      return 'El equipo ya está asignado a otra zona de la misma categoría.';
    }
  }
  return null;
}

/**
 * Auto-balance round-robin puro.
 *
 * Recibe los IDs de los equipos y los IDs de las zonas (en orden) y devuelve
 * un mapa `zoneId -> teamId[]`. La distribución es round-robin determinística:
 * `teams[i]` cae en `zones[i % zones.length]`.
 *
 * No revuelve el array — el caller decide si quiere shuffling estable o no.
 */
export function distributeTeamsRoundRobin(
  teamIds: readonly string[],
  zoneIds: readonly string[],
): Map<string, string[]> {
  if (zoneIds.length === 0) {
    throw new Error('No hay zonas para distribuir equipos.');
  }
  const result = new Map<string, string[]>();
  for (const z of zoneIds) result.set(z, []);
  teamIds.forEach((teamId, idx) => {
    const zoneId = zoneIds[idx % zoneIds.length];
    result.get(zoneId)!.push(teamId);
  });
  return result;
}
