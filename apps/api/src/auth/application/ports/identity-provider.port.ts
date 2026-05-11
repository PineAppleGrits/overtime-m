import type { User } from '@supabase/supabase-js';

export const IDENTITY_PROVIDER = Symbol('IDENTITY_PROVIDER');

export interface IIdentityProvider {
  validateToken(token: string): Promise<User>;
}
