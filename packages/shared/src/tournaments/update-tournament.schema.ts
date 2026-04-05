import { z } from "zod";
import {
  createTournamentBaseSchema,
  validateTournamentDatePairs,
} from "./create-tournament.schema";

export const updateTournamentSchema = createTournamentBaseSchema
  .partial()
  .superRefine(validateTournamentDatePairs);

export type UpdateTournamentSchemaDto = z.infer<typeof updateTournamentSchema>;
