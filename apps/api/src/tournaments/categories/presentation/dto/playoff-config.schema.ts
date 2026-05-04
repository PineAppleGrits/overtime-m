import { PlayoffFormat } from '@prisma/client';
import { z } from 'zod';
import { MAX_ZONES_PER_CATEGORY } from '../../domain/rules/playoff-config.rules';

/**
 * Schema Zod para `Category.playoffFormatByRound`.
 *
 * Acepta un objeto opcional con claves de ronda y valores BO1/BO3/BO5.
 * Las claves son todas opcionales — la categoría puede configurar solo
 * las rondas que efectivamente jueguen.
 */
export const PlayoffFormatEnum = z.enum([
  PlayoffFormat.BO1,
  PlayoffFormat.BO3,
  PlayoffFormat.BO5,
] as const);

export const PlayoffFormatByRoundSchema = z
  .object({
    playIn: PlayoffFormatEnum.optional(),
    quarterfinal: PlayoffFormatEnum.optional(),
    semifinal: PlayoffFormatEnum.optional(),
    final: PlayoffFormatEnum.optional(),
    thirdPlace: PlayoffFormatEnum.optional(),
  })
  .strict()
  .nullable()
  .optional();

export type PlayoffFormatByRoundInput = z.infer<typeof PlayoffFormatByRoundSchema>;

/**
 * Schema para el body del endpoint `PATCH .../playoff-config`.
 *
 * Todas las claves son opcionales — el caller puede actualizar solo
 * un subset (ej. apenas `zonesCount` o solo `playoffFormatByRound`).
 */
export const UpdatePlayoffConfigSchema = z
  .object({
    zonesCount: z
      .number()
      .int()
      .min(1)
      .max(MAX_ZONES_PER_CATEGORY)
      .optional(),
    qualifierCount: z.number().int().min(1).nullable().optional(),
    qualifiersPerZone: z.number().int().min(1).nullable().optional(),
    hasPlayIn: z.boolean().optional(),
    hasThirdPlaceMatch: z.boolean().optional(),
    playoffFormatByRound: PlayoffFormatByRoundSchema,
  })
  .strict();

export type UpdatePlayoffConfigInput = z.infer<typeof UpdatePlayoffConfigSchema>;
