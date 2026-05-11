'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Settings, Trophy, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/profile', label: 'Información y configuración', shortLabel: 'Información', icon: <Settings className="size-4" /> },
  { href: '/profile/torneos', label: 'Mis torneos', shortLabel: 'Torneos', icon: <Trophy className="size-4" /> },
  { href: '/profile/equipos', label: 'Mis equipos', shortLabel: 'Equipos', icon: <Users className="size-4" /> },
] as const;

export function ProfileNav() {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile: horizontal tabs */}
      <nav
        className="lg:hidden"
        role="navigation"
        aria-label="Secciones del perfil"
      >
        <ul className="flex gap-1 overflow-x-auto rounded-lg bg-ot-dark-blue/40 p-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href} className="shrink-0">
                <Link
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-ot-orange/15 text-ot-orange'
                      : 'text-white/60 hover:text-white'
                  )}
                >
                  {item.icon}
                  {item.shortLabel}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Desktop: vertical sidebar */}
      <nav
        className="hidden w-64 shrink-0 lg:block"
        role="navigation"
        aria-label="Secciones del perfil"
      >
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-ot-orange/15 text-ot-orange'
                      : 'text-white/70 hover:bg-white/5 hover:text-white'
                  )}
                >
                  {item.icon}
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
