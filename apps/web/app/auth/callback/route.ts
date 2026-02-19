import { createClient } from '@/lib/supabase/server';
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
      const forwardedHost = request.headers.get('x-forwarded-host');
      const isLocalEnv = process.env.NODE_ENV === 'development';
      
      if (isLocalEnv) {
        // En desarrollo, redirigir a localhost
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        // En producción con proxy, usar el host forwardeado
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  // Si algo salió mal, redirigir a error page
  return NextResponse.redirect(`${origin}/auth/error`);
}

