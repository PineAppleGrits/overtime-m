'use client';

import { useAuth } from '@/providers/AuthProvider';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/modules/common/components/Button';
import Image from 'next/image';
import { hasAdminRole } from '@/lib/auth/hasAdminRole';

export function UserMenu() {
  const { user, profile, signOut, loading, refresh } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  if (loading) {
    return <div className="h-10 w-10 animate-pulse rounded-full bg-gray-200" />;
  }

  if (!user || !profile) {
    return (
      <Button
        href="/auth/login"
      >
        Iniciar Sesión
      </Button>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-ot-orange/10 cursor-pointer"
      >
        {profile.avatarUrl ? (
          <Image
            src={profile.avatarUrl}
            alt={profile.name}
            className="h-8 w-8 rounded-full"
            width={32}
            height={32}
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white">
            {profile.name.charAt(0).toUpperCase()}
          </div>
        )}
        <span className="font-medium">{profile.name}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-xl bg-[#1a1730] shadow-xl ring-1 ring-white/10 z-10 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/10">
            <p className="text-xs text-white/50 uppercase tracking-wider">Cuenta</p>
            <p className="mt-0.5 text-sm font-medium text-white">{profile.name}</p>
          </div>

          <div className="p-1.5">
            <Link
              href="/profile"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/80 transition-colors hover:bg-white/8 hover:text-white"
              onClick={() => setIsOpen(false)}
            >
              Mi perfil
            </Link>
            <Link
              href="/profile/torneos"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/80 transition-colors hover:bg-white/8 hover:text-white"
              onClick={() => setIsOpen(false)}
            >
              Mis torneos
            </Link>
            <Link
              href="/profile/equipos"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/80 transition-colors hover:bg-white/8 hover:text-white"
              onClick={() => setIsOpen(false)}
            >
              Mis equipos
            </Link>
          </div>

          {hasAdminRole(profile) && (
            <>
              <div className="mx-3 border-t border-white/10" />
              <div className="p-1.5">
                <Link
                  href="/admin"
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[#ff3b2f]/90 transition-colors hover:bg-[#ff3b2f]/10 hover:text-[#ff3b2f]"
                  onClick={() => setIsOpen(false)}
                >
                  Panel de Admin
                </Link>
              </div>
            </>
          )}

          <div className="mx-3 border-t border-white/10" />
          <div className="p-1.5">
            <button
              onClick={() => { signOut(); setIsOpen(false) }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-white/50 transition-colors hover:bg-white/8 hover:text-white/80 cursor-pointer"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

