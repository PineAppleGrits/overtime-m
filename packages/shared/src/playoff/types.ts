export type PlayoffRound =
  | 'PLAY_IN'
  | 'ROUND_OF_16'
  | 'QUARTERFINAL'
  | 'SEMIFINAL'
  | 'THIRD_PLACE'
  | 'FINAL'
  | 'PROMOTION_PLAYOFF';

export type PlayoffFormat = 'BO1' | 'BO3' | 'BO5';

export type PlayoffSeriesStatus =
  | 'PENDING'
  | 'READY'
  | 'IN_PROGRESS'
  | 'COMPLETED';

export interface PlayoffSeriesDto {
  id: string;
  categoryId: string;
  round: PlayoffRound;
  bracketPosition: number;
  format: PlayoffFormat;
  homeTeamId: string | null;
  awayTeamId: string | null;
  feedsFromSeriesAId: string | null;
  feedsFromSeriesBId: string | null;
  winnerTeamId: string | null;
  status: PlayoffSeriesStatus;
  createdAt: string;
  updatedAt: string;
}

/**
 * Config de playoffs por ronda al crear/editar una categoría.
 * Se guarda en `Category.playoffFormatByRound` (jsonb).
 */
export interface PlayoffFormatByRound {
  playIn?: PlayoffFormat;
  quarterfinal?: PlayoffFormat;
  semifinal?: PlayoffFormat;
  final?: PlayoffFormat;
  thirdPlace?: PlayoffFormat;
}

/**
 * Vista del bracket completo de una categoría — útil para que el FE
 * dibuje el cuadro sin hacer N requests.
 */
export interface BracketViewDto {
  categoryId: string;
  series: PlayoffSeriesDto[];
}
