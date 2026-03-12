'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { Menu, ChevronDown, LogOut, User, ShieldCheck } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { Button } from '@/modules/common/components/Button';
import { hasAdminRole } from '@/lib/auth/hasAdminRole';

type MobileNavItem = {
  id: string;
  name: string;
  href: string;
  subMenu?: MobileNavItem[];
};

export function MobileNav({ navItems }: { navItems: MobileNavItem[] }) {
  const { user, profile, signOut } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="flex items-center gap-3 lg:hidden">
      {/* User avatar (no name on mobile) */}
      {user && profile && (
        <Link href="/profile" className="shrink-0" aria-label="Mi perfil">
          {profile.avatarUrl ? (
            <Image
              src={profile.avatarUrl}
              alt={profile.name}
              width={32}
              height={32}
              className="h-8 w-8 rounded-full"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-ot-orange text-sm font-bold text-white">
              {profile.name.charAt(0).toUpperCase()}
            </div>
          )}
        </Link>
      )}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button
            aria-label="Abrir menú"
            className="flex h-10 w-10 items-center justify-center rounded-lg text-white hover:bg-white/10 cursor-pointer"
          >
            <Menu className="h-6 w-6" />
          </button>
        </SheetTrigger>

        <SheetContent
          side="left"
          className="flex w-[280px] flex-col border-ot-light-blue bg-ot-dark-blue p-0 sm:max-w-[280px]"
        >
          <SheetHeader className="border-b border-white/10 px-5 py-4">
            <SheetTitle className="flex items-center gap-2">
              <Image src="/overtime_logo.png" alt="Overtime" width={40} height={21} />
              <span className="text-base font-bold uppercase text-white">Overtime</span>
            </SheetTitle>
          </SheetHeader>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Menú principal">
            <ul className="space-y-1">
              {navItems.map((item) => {
                const hasSubmenu = item.subMenu && item.subMenu.length > 0;
                const isExpanded = expandedIds.has(item.id);
                const isActive = pathname === item.href;

                return (
                  <li key={item.id}>
                    {hasSubmenu ? (
                      <>
                        <button
                          onClick={() => toggleExpanded(item.id)}
                          aria-expanded={isExpanded}
                          className={cn(
                            'flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-semibold uppercase transition-colors cursor-pointer',
                            isActive
                              ? 'bg-ot-orange/15 text-ot-orange'
                              : 'text-white/80 hover:bg-white/5 hover:text-white'
                          )}
                        >
                          {item.name}
                          <ChevronDown
                            className={cn(
                              'h-4 w-4 transition-transform duration-200',
                              isExpanded && 'rotate-180'
                            )}
                          />
                        </button>
                        {isExpanded && (
                          <ul className="mt-1 space-y-0.5 pl-3">
                            {item.subMenu!.map((sub) => (
                              <MobileSubItem
                                key={sub.id}
                                item={sub}
                                pathname={pathname}
                                onNavigate={() => setOpen(false)}
                                depth={1}
                              />
                            ))}
                          </ul>
                        )}
                      </>
                    ) : (
                      <Link
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          'block rounded-lg px-3 py-2.5 text-sm font-semibold uppercase transition-colors',
                          isActive
                            ? 'bg-ot-orange/15 text-ot-orange'
                            : 'text-white/80 hover:bg-white/5 hover:text-white'
                        )}
                      >
                        {item.name}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Footer: user actions */}
          <div className="border-t border-white/10 px-3 py-4">
            {user && profile ? (
              <div className="space-y-1">
                <Link
                  href="/profile"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/80 hover:bg-white/5 hover:text-white"
                >
                  <User className="h-4 w-4" />
                  Mi perfil
                </Link>
                {hasAdminRole(profile) && (
                  <Link
                    href="/admin"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-purple-400 hover:bg-white/5"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    Panel de Admin
                  </Link>
                )}
                <button
                  onClick={() => {
                    signOut();
                    setOpen(false);
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-400 hover:bg-white/5 cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  Cerrar Sesión
                </button>
              </div>
            ) : (
              <Button href="/auth/login" className="block w-full text-center">
                Iniciar Sesión
              </Button>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function MobileSubItem({
  item,
  pathname,
  onNavigate,
  depth,
}: {
  item: MobileNavItem;
  pathname: string;
  onNavigate: () => void;
  depth: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasSubmenu = item.subMenu && item.subMenu.length > 0;
  const isActive = pathname === item.href;

  if (hasSubmenu) {
    return (
      <li>
        <button
          onClick={() => setExpanded(!expanded)}
          aria-expanded={expanded}
          className={cn(
            'flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition-colors cursor-pointer',
            isActive ? 'text-ot-orange' : 'text-white/60 hover:text-white'
          )}
        >
          <span>{item.name}</span>
          <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', expanded && 'rotate-180')} />
        </button>
        {expanded && (
          <ul className="mt-0.5 space-y-0.5 pl-3">
            {item.subMenu!.map((sub) => (
              <MobileSubItem
                key={sub.id}
                item={sub}
                pathname={pathname}
                onNavigate={onNavigate}
                depth={depth + 1}
              />
            ))}
          </ul>
        )}
      </li>
    );
  }

  return (
    <li>
      <Link
        href={item.href}
        onClick={onNavigate}
        className={cn(
          'block rounded-md px-3 py-2 text-sm transition-colors uppercase',
          isActive ? 'text-ot-orange' : 'text-white/60 hover:text-white'
        )}
      >
        {item.name}
      </Link>
    </li>
  );
}
