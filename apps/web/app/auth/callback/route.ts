import { createClient } from '@/lib/supabase/server';
import { getProfile } from '@/lib/auth/session';
import { NextResponse } from 'next/server';

/**
 * OAuth Callback Handler
 * Maneja el callback de Google OAuth y establece la sesión server-side
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = await createClient();

    // Exchange code for session (sets cookies server-side)
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Determinar la ruta de redirección
      let redirectPath = next;

      // Verificar si el usuario necesita completar el onboarding
      try {
        const profile = await getProfile();
        if (profile && !profile.documentNumber) {
          redirectPath = '/onboarding';
        }
      } catch {
        // Si falla la verificación del perfil, continuar con la ruta normal
      }

      // Usar directamente el origin (en Vercel será el dominio correcto)
      // O hacer fallback a los headers nativos de next/server si se precisa un overriding duro
      const forwardedHost = request.headers.get('x-forwarded-host');
      const forwardedProto = request.headers.get('x-forwarded-proto') ?? 'https';

      if (forwardedHost) {
        return NextResponse.redirect(`${forwardedProto}://${forwardedHost}${redirectPath}`);
      }

      return NextResponse.redirect(`${origin}${redirectPath}`);
    }
  }

  // Si algo salió mal, redirigir a error page
  return NextResponse.redirect(`${origin}/auth/error`);
}

