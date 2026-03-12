'use client';

import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

const getURL = () => {
  let url =
    process?.env?.NEXT_PUBLIC_SITE_URL ?? // Set this to your site URL in production env.
    process?.env?.NEXT_PUBLIC_VERCEL_URL ?? // Automatically set by Vercel.
    'http://localhost:3000/'
  // Make sure to include `https://` when not localhost.
  url = url.startsWith('http') ? url : `https://${url}`
  // Make sure to include a trailing `/`.
  url = url.endsWith('/') ? url : `${url}/`
  return url
}

export type Profile = {
  id: string;
  supabaseUserId: string;
  email: string;
  name: string;
  avatarUrl?: string;
  role: string;
  hasPlayerProfile: boolean;
  playerId?: string;
  playerName?: string;
  documentNumber: string | null;
};

export type AuthUser = Record<string, unknown> & {
  id: string;
  email?: string;
};

type AuthContextType = {
  user: AuthUser | null;
  profile: Profile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthProviderProps = {
  children: React.ReactNode;
  serverUser: Record<string, unknown> | null;
  serverProfile: Record<string, unknown> | null;
};

/**
 * AuthProvider que recibe datos del servidor (SSR)
 * La sesión se maneja server-side mediante cookies
 */
export function AuthProvider({
  children,
  serverUser,
  serverProfile,
}: AuthProviderProps) {
  const user = serverUser as AuthUser | null;
  const profile = serverProfile as Profile | null;
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const isInitialAuthEvent = useRef(true);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {

      if (isInitialAuthEvent.current) {
        isInitialAuthEvent.current = false;
        return;
      }
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        router.refresh();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router, supabase]);

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${getURL()}/auth/callback`,
        },
      });

      if (error) {
        console.error('Error signing in:', error);
        throw error;
      }
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
        throw error;
      }
      // Router will refresh automatically via onAuthStateChange
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => {
    router.refresh();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signInWithGoogle,
        signOut,
        refresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

