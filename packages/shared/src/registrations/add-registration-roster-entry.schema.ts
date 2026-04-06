import { z } from "zod";
import { registrationRosterPlayerSchema } from "./create-registration.schema";

export const addRegistrationRosterEntrySchema = registrationRosterPlayerSchema;

export type AddRegistrationRosterEntryDto = z.infer<
  typeof addRegistrationRosterEntrySchema
>;
