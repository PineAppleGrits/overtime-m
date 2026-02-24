import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import AuthService from './modules/auth/AuthService';

type ProxyAuthData = {
  user: Record<string, unknown> | null;
  profile: Record<string, unknown> | null;
};

const PROTECTED_PATHS = ['/admin', '/profile', '/teams/create'];

const SKIP_PROFILE_PREFIXES = [
  '/admin',
  '/auth',
];

function shouldFetchProfile(pathname: string): boolean {
  return !SKIP_PROFILE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isProtectedPath = PROTECTED_PATHS.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  if (isProtectedPath && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/login';
    url.searchParams.set('redirectTo', request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  if (request.nextUrl.pathname.startsWith('/auth/login') && user) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  let profile: Record<string, unknown> | null = null;

  if (user && shouldFetchProfile(request.nextUrl.pathname)) {
    try {
      const response = await AuthService.getProfile();
      profile = response?.data ?? null;

      if (
        profile &&
        !profile.documentNumber &&
        !request.nextUrl.pathname.startsWith('/profile')
      ) {
        const url = request.nextUrl.clone();
        url.pathname = '/profile';
        return NextResponse.redirect(url);
      }
    } catch {
      profile = null;
    }
  }

  const authData: ProxyAuthData = { user: user as Record<string, unknown> | null, profile };
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-auth-data', JSON.stringify(authData));

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  supabaseResponse.cookies.getAll().forEach((cookie) => {
    response.cookies.set(cookie);
  });

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|ico|woff|woff2|ttf|eot|otf)$).*)',
  ],
};
