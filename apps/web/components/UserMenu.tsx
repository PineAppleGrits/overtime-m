'use client';

import { useAuth } from '@/providers/AuthProvider';
import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/modules/common/components/Button';
import Image from 'next/image';

export function UserMenu() {
  const { user, profile, signOut, loading, refresh } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

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
    <div className="relative">
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
        <div className="absolute right-0 mt-2 w-64 rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5">
          <div className="px-4 py-3 border-b">
            <p className="text-sm font-medium text-gray-900">{profile.name}</p>
          </div>

          <div className="py-1">
            <Link
              href="/profile"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Mi perfil
            </Link>
            <Link
              href="/profile/settings"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Configuración de cuenta
            </Link>

            {profile.roles.includes('admin') && (
              <Link
                href="/admin"
                className="block px-4 py-2 text-sm text-purple-600 hover:bg-gray-100"
              >
                Panel de Admin
              </Link>
            )}
          </div>

          <div className="border-t py-1">
            <button
              onClick={() => {
                signOut();
                setIsOpen(false);
              }}
              className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100 cursor-pointer"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

