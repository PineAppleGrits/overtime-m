/**
 * Mapeo de valores canónicos de `matchType` (BE) a labels user-facing (FE).
 *
 * Los valores del BE son enum-like (`regular`, `playoff`, ...). Si llega un
 * valor desconocido (por ejemplo un mock legacy con label ya formateado, o un
 * tipo nuevo aún no mapeado) se devuelve tal cual para no romper la UI.
 */
const MATCH_TYPE_LABELS: Record<string, string> = {
  regular: 'Zona Regular',
  playoff: 'Playoff',
  friendly: 'Amistoso',
  play_in: 'Play-in',
  promotion_playoff: 'Repechaje',
}

export function matchTypeLabel(value: string): string {
  return MATCH_TYPE_LABELS[value] ?? value
}
