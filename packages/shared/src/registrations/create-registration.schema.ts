import { z } from 'zod';

const trimmedStringSchema = z.preprocess(
  (value) => {
    if (typeof value !== 'string') {
      return value;
    }

    return value.trim();
  },
  z.string().min(1),
);

export const registrationRosterPlayerSchema = z.object({
  documentNumber: trimmedStringSchema,
  name: trimmedStringSchema,
});

const uniqueRosterPlayerArray = z
  .array(registrationRosterPlayerSchema)
  .min(8, 'La buena fe inicial debe tener al menos 8 jugadores')
  .max(25, 'La buena fe inicial no puede superar 25 jugadores')
  .superRefine((players, ctx) => {
    const uniqueDocumentNumbers = new Set<string>();

    players.forEach((player, index) => {
      if (uniqueDocumentNumbers.has(player.documentNumber)) {
        ctx.addIssue({
          code: 'custom',
          path: [index, 'documentNumber'],
          message: 'La buena fe inicial no puede tener DNIs duplicados',
        });
        return;
      }

      uniqueDocumentNumbers.add(player.documentNumber);
    });
  });

export const createRegistrationSchema = z.object({
  teamId: z.string().uuid('El equipo es invalido'),
  tournamentId: z.string().uuid('El torneo es invalido'),
  categoryId: z.string().uuid('La categoria es invalida'),
  initialRoster: uniqueRosterPlayerArray,
});

export type CreateRegistrationSchemaDto = z.infer<
  typeof createRegistrationSchema
>;
export type RegistrationRosterPlayerDto = z.infer<
  typeof registrationRosterPlayerSchema
>;
