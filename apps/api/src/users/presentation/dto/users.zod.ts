import { ProfileRole } from '@prisma/client';
import { z } from 'zod';

const profileRoleEnum = z.nativeEnum(ProfileRole);

export const verifyDniSchema = z.object({
  documentNumber: z
    .string()
    .min(7, 'Documento muy corto')
    .max(20, 'Documento muy largo'),
});
export type VerifyDniInputDto = z.infer<typeof verifyDniSchema>;

export const assignRoleSchema = z.object({
  role: profileRoleEnum,
});
export type AssignRoleInputDto = z.infer<typeof assignRoleSchema>;

export const preCreateAccountSchema = z.object({
  email: z.string().email(),
  role: profileRoleEnum,
  name: z.string().min(1).max(120).optional(),
});
export type PreCreateAccountInputDto = z.infer<typeof preCreateAccountSchema>;
