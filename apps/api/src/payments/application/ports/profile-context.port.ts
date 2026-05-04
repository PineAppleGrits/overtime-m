/**
 * Puerto mínimo para consultar info del Profile (lookup de email/nombre para
 * checkout MP y emails de confirmación). Aísla del módulo `Users`.
 */
export interface ProfileSummary {
  id: string;
  name: string;
  email: string | null;
}

export interface IProfileContextPort {
  getById(profileId: string): Promise<ProfileSummary | null>;
}

export const PROFILE_CONTEXT_PORT = Symbol('PROFILE_CONTEXT_PORT');
