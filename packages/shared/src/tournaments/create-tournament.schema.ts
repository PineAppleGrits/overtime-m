import { z } from "zod";
import { optionalDateStringSchema } from "../common/date-string.schema";
import { TournamentStatus, FixtureFormat } from "./enums";

const validateTournamentDatePairs = (
  value: Record<string, string | number | undefined>,
  ctx: z.RefinementCtx,
): void => {
  const datePairs = [
    [
      "startDate",
      "endDate",
      "La fecha de inicio debe ser anterior a la fecha de fin",
    ],
    [
      "registrationStartDate",
      "registrationEndDate",
      "La apertura de inscripcion debe ser anterior al cierre de inscripcion",
    ],
    [
      "teamOperationsOpenAt",
      "teamOperationsCloseAt",
      "La apertura operativa debe ser anterior al cierre operativo",
    ],
  ] as const;

  for (const [startKey, endKey, message] of datePairs) {
    const startValue = value[startKey];
    const endValue = value[endKey];

    if (
      typeof startValue === "string" &&
      typeof endValue === "string" &&
      new Date(startValue) > new Date(endValue)
    ) {
      ctx.addIssue({
        code: "custom",
        path: [endKey],
        message,
      });
    }
  }
};

export const createTournamentBaseSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio"),
  description: z.string().trim().optional(),
  sportId: z.string().uuid("La disciplina es invalida"),
  status: z.nativeEnum(TournamentStatus).optional(),
  fixtureFormat: z.nativeEnum(FixtureFormat).optional(),
  modality: z.string().trim().max(40).optional(),
  startDate: optionalDateStringSchema,
  endDate: optionalDateStringSchema,
  registrationStartDate: optionalDateStringSchema,
  registrationEndDate: optionalDateStringSchema,
  teamOperationsOpenAt: optionalDateStringSchema,
  teamOperationsCloseAt: optionalDateStringSchema,
  insurancePerPlayer: z.coerce
    .number()
    .min(0, "El seguro por jugador no puede ser negativo")
    .optional(),
});

export const createTournamentSchema = createTournamentBaseSchema.superRefine(
  validateTournamentDatePairs,
);

export type CreateTournamentSchemaDto = z.infer<typeof createTournamentSchema>;
export { validateTournamentDatePairs };
