import { z } from 'zod';

const nonNegInt = z.number().int().min(0).optional().default(0);

/**
 * Zod schema para el payload de POST /matches/:id/player-stats.
 *
 * Cada entrada apunta a un jugador con los counts opcionales (default 0).
 * `points` no se valida acá — lo computa el service como `pt1 + 2*pt2 + 3*pt3`.
 */
export const matchPlayerStatEntrySchema = z.object({
  profileId: z.string().uuid(),
  teamId: z.string().uuid(),
  pt1: nonNegInt,
  pt1Att: nonNegInt,
  pt2: nonNegInt,
  pt2Att: nonNegInt,
  pt3: nonNegInt,
  pt3Att: nonNegInt,
  fouls: nonNegInt,
  steals: nonNegInt,
  rebounds: nonNegInt,
  assists: nonNegInt,
  turnovers: nonNegInt,
  blocks: nonNegInt,
});

export const upsertMatchPlayerStatsSchema = z.object({
  stats: z.array(matchPlayerStatEntrySchema).min(1, 'stats no puede estar vacío'),
});

export type UpsertMatchPlayerStatsBody = z.infer<
  typeof upsertMatchPlayerStatsSchema
>;
export type MatchPlayerStatEntry = z.infer<typeof matchPlayerStatEntrySchema>;
