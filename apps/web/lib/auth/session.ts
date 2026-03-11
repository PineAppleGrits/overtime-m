import AuthService from '@/modules/auth/AuthService';
import { getSession } from '../supabase/getSessionSsr';

/**
 * Get the profile from backend server-side
 * This should be called from Server Components
 * 
 * NOTE: El perfil se crea automáticamente por un trigger de Supabase
 * cuando el usuario se registra, así que siempre debería existir.
 */
export async function getProfile() {
  const session = await getSession();

  if (!session?.access_token) {
    return null;
  }

  try {
    const response = await AuthService.getProfile();

    const profile = {
      ...response.data,
      roles: ['admin']
    }

    return profile;
  } catch (error) {
    console.error('Error fetching profile server-side:', error);
    return null;
  }
}

