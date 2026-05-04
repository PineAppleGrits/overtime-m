import { PlayoffFormat, PlayoffRound } from '@prisma/client';
import { PlayoffFormatByRound } from '@overtime-mono/shared';

/**
 * Equipo clasificado a playoffs con su contexto de zona.
 */
export interface QualifiedTeam {
  teamId: string;
  teamName?: string;
  /** Posición dentro de la zona (1 = mejor). */
  zoneRank: number;
  /** ID de la zona (si zonesCount > 1) o null. */
  zoneId: string | null;
}

/**
 * Definición de una serie de playoff (sin persistir).
 */
export interface SeriesPlan {
  round: PlayoffRound;
  bracketPosition: number;
  format: PlayoffFormat;
  homeTeamId: string | null;
  awayTeamId: string | null;
  /** bracketPosition de la serie alimentadora A (round previa). */
  feedsFromA: number | null;
  feedsFromB: number | null;
}

/**
 * Tabla de wins-needed-to-clinch por formato.
 */
export const WINS_TO_CLINCH: Record<PlayoffFormat, number> = {
  BO1: 1,
  BO3: 2,
  BO5: 3,
};

export const GAMES_PER_FORMAT: Record<PlayoffFormat, number> = {
  BO1: 1,
  BO3: 3,
  BO5: 5,
};

function resolveFormat(
  round: PlayoffRound,
  formatByRound: PlayoffFormatByRound | null | undefined,
  fallback: PlayoffFormat,
): PlayoffFormat {
  if (!formatByRound) return fallback;
  switch (round) {
    case 'PLAY_IN':
      return (formatByRound.playIn as PlayoffFormat) ?? fallback;
    case 'QUARTERFINAL':
      return (formatByRound.quarterfinal as PlayoffFormat) ?? fallback;
    case 'SEMIFINAL':
      return (formatByRound.semifinal as PlayoffFormat) ?? fallback;
    case 'FINAL':
      return (formatByRound.final as PlayoffFormat) ?? fallback;
    case 'THIRD_PLACE':
      return (formatByRound.thirdPlace as PlayoffFormat) ?? fallback;
    default:
      return fallback;
  }
}

/**
 * Genera la planificación del bracket para una categoría con `zonesCount=1`.
 * Cruce 1 vs N, 2 vs N-1, etc. dentro de la única zona.
 */
function planSingleZoneBracket(
  qualifiers: QualifiedTeam[],
  formatByRound: PlayoffFormatByRound | null | undefined,
  defaultFormat: PlayoffFormat,
  hasThirdPlaceMatch: boolean,
): SeriesPlan[] {
  const ordered = [...qualifiers].sort((a, b) => a.zoneRank - b.zoneRank);
  const n = ordered.length;
  if (n < 2) return [];

  const plans: SeriesPlan[] = [];

  // Determina la primera ronda según count: 8→QF, 4→SF, 2→FINAL.
  let firstRound: PlayoffRound;
  if (n >= 8) firstRound = 'QUARTERFINAL';
  else if (n >= 4) firstRound = 'SEMIFINAL';
  else firstRound = 'FINAL';

  const firstFmt = resolveFormat(firstRound, formatByRound, defaultFormat);

  // Pares 1vsN, 2vsN-1, ...
  const pairCount = Math.floor(n / 2);
  const pairs: Array<{ home: QualifiedTeam; away: QualifiedTeam }> = [];
  for (let i = 0; i < pairCount; i++) {
    pairs.push({ home: ordered[i], away: ordered[n - 1 - i] });
  }

  pairs.forEach((pair, idx) => {
    plans.push({
      round: firstRound,
      bracketPosition: idx + 1,
      format: firstFmt,
      homeTeamId: pair.home.teamId,
      awayTeamId: pair.away.teamId,
      feedsFromA: null,
      feedsFromB: null,
    });
  });

  // Generar rondas siguientes "vacías" (PENDING)
  let prevCount = pairs.length;
  let currentRound: PlayoffRound | null = firstRound;
  while (prevCount > 1 && currentRound) {
    let nextRound: PlayoffRound | null;
    switch (currentRound) {
      case 'QUARTERFINAL':
        nextRound = 'SEMIFINAL';
        break;
      case 'SEMIFINAL':
        nextRound = 'FINAL';
        break;
      default:
        nextRound = null;
    }
    if (!nextRound) break;
    const nextCount = Math.floor(prevCount / 2);
    const fmt = resolveFormat(nextRound, formatByRound, defaultFormat);
    for (let i = 0; i < nextCount; i++) {
      plans.push({
        round: nextRound,
        bracketPosition: i + 1,
        format: fmt,
        homeTeamId: null,
        awayTeamId: null,
        feedsFromA: i * 2 + 1,
        feedsFromB: i * 2 + 2,
      });
    }
    currentRound = nextRound;
    prevCount = nextCount;
  }

  // Tercer puesto si corresponde y hay semifinales
  if (hasThirdPlaceMatch && plans.some((p) => p.round === 'SEMIFINAL')) {
    plans.push({
      round: 'THIRD_PLACE',
      bracketPosition: 1,
      format: resolveFormat('THIRD_PLACE', formatByRound, 'BO1'),
      homeTeamId: null,
      awayTeamId: null,
      feedsFromA: 1,
      feedsFromB: 2,
    });
  }

  return plans;
}

/**
 * Genera el bracket NBA-style para 2 zonas.
 *
 * Cuartos: 1°A vs 4°B, 2°A vs 3°B, 1°B vs 4°A, 2°B vs 3°A.
 * (DP-003 — máx 2 zonas, cruce NBA).
 */
function planTwoZoneBracket(
  qualifiers: QualifiedTeam[],
  formatByRound: PlayoffFormatByRound | null | undefined,
  defaultFormat: PlayoffFormat,
  hasThirdPlaceMatch: boolean,
): SeriesPlan[] {
  // Separar por zonas
  const zoneIds = Array.from(new Set(qualifiers.map((q) => q.zoneId))).filter(
    (z): z is string => z !== null,
  );
  if (zoneIds.length !== 2) {
    // Fallback: tratar como single zone si no se cumple la precondición
    return planSingleZoneBracket(
      qualifiers,
      formatByRound,
      defaultFormat,
      hasThirdPlaceMatch,
    );
  }
  const [zoneA, zoneB] = zoneIds;
  const sorted = (zid: string) =>
    qualifiers.filter((q) => q.zoneId === zid).sort((a, b) => a.zoneRank - b.zoneRank);
  const A = sorted(zoneA);
  const B = sorted(zoneB);

  const perZone = Math.min(A.length, B.length);
  if (perZone < 2) return [];

  const plans: SeriesPlan[] = [];

  // Si hay 4 por zona → cuartos. Si 2 por zona → directo a SEMIFINAL.
  if (perZone >= 4) {
    const fmt = resolveFormat('QUARTERFINAL', formatByRound, defaultFormat);
    // 1A vs 4B, 2A vs 3B, 1B vs 4A, 2B vs 3A
    const pairs: Array<{ home: QualifiedTeam; away: QualifiedTeam }> = [
      { home: A[0], away: B[3] },
      { home: A[1], away: B[2] },
      { home: B[0], away: A[3] },
      { home: B[1], away: A[2] },
    ];
    pairs.forEach((pair, idx) => {
      plans.push({
        round: 'QUARTERFINAL',
        bracketPosition: idx + 1,
        format: fmt,
        homeTeamId: pair.home.teamId,
        awayTeamId: pair.away.teamId,
        feedsFromA: null,
        feedsFromB: null,
      });
    });

    // Semifinales: SF1 = ganador QF1 vs ganador QF2, SF2 = ganador QF3 vs QF4
    const sfFmt = resolveFormat('SEMIFINAL', formatByRound, defaultFormat);
    plans.push({
      round: 'SEMIFINAL',
      bracketPosition: 1,
      format: sfFmt,
      homeTeamId: null,
      awayTeamId: null,
      feedsFromA: 1,
      feedsFromB: 2,
    });
    plans.push({
      round: 'SEMIFINAL',
      bracketPosition: 2,
      format: sfFmt,
      homeTeamId: null,
      awayTeamId: null,
      feedsFromA: 3,
      feedsFromB: 4,
    });
  } else {
    // Solo 2 por zona — semifinales directas
    const sfFmt = resolveFormat('SEMIFINAL', formatByRound, defaultFormat);
    plans.push({
      round: 'SEMIFINAL',
      bracketPosition: 1,
      format: sfFmt,
      homeTeamId: A[0].teamId,
      awayTeamId: B[1].teamId,
      feedsFromA: null,
      feedsFromB: null,
    });
    plans.push({
      round: 'SEMIFINAL',
      bracketPosition: 2,
      format: sfFmt,
      homeTeamId: B[0].teamId,
      awayTeamId: A[1].teamId,
      feedsFromA: null,
      feedsFromB: null,
    });
  }

  // Final
  plans.push({
    round: 'FINAL',
    bracketPosition: 1,
    format: resolveFormat('FINAL', formatByRound, defaultFormat),
    homeTeamId: null,
    awayTeamId: null,
    feedsFromA: 1,
    feedsFromB: 2,
  });

  // Tercer puesto
  if (hasThirdPlaceMatch) {
    plans.push({
      round: 'THIRD_PLACE',
      bracketPosition: 1,
      format: resolveFormat('THIRD_PLACE', formatByRound, 'BO1'),
      homeTeamId: null,
      awayTeamId: null,
      feedsFromA: 1,
      feedsFromB: 2,
    });
  }

  return plans;
}

export interface BracketPlanInput {
  qualifiers: QualifiedTeam[];
  zonesCount: number;
  formatByRound: PlayoffFormatByRound | null | undefined;
  defaultFormat?: PlayoffFormat;
  hasThirdPlaceMatch: boolean;
  hasPlayIn: boolean;
}

/**
 * Genera el plan completo del bracket.
 *
 * - DP-003: solo soporta zonesCount = 1 ó 2.
 * - DP-014 (play-in): si `hasPlayIn=true`, agrega un PLAY_IN (BO1 default)
 *   entre 8° y 9° → ganador entra como 8° clasificado. **TODO: DP-014.**
 */
export function planBracket(input: BracketPlanInput): SeriesPlan[] {
  const defaultFormat = input.defaultFormat ?? 'BO3';

  const plans: SeriesPlan[] = [];

  // TODO: DP-014 — play-in entre 8° y 9° de la fase regular.
  // Por ahora, si hasPlayIn=true asumimos que el último cupo viene del play-in.
  // En este punto no agregamos series PLAY_IN porque la lógica del 8°/9°
  // necesita más definición — la implementación queda preparada en el plan.
  if (input.hasPlayIn) {
    // Placeholder: si hay 9 clasificados, los 2 últimos juegan PLAY_IN
    // Esto se implementará cuando se cierre DP-014.
  }

  if (input.zonesCount === 2) {
    plans.push(
      ...planTwoZoneBracket(
        input.qualifiers,
        input.formatByRound,
        defaultFormat,
        input.hasThirdPlaceMatch,
      ),
    );
  } else {
    plans.push(
      ...planSingleZoneBracket(
        input.qualifiers,
        input.formatByRound,
        defaultFormat,
        input.hasThirdPlaceMatch,
      ),
    );
  }

  return plans;
}
