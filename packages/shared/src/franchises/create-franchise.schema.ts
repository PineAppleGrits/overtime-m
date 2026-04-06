import { z } from "zod";
import { optionalUrlSchema } from "../common/zod-helpers";

export const createFranchiseSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio"),
  logoUrl: optionalUrlSchema,
});

export type CreateFranchiseSchemaDto = z.infer<typeof createFranchiseSchema>;
