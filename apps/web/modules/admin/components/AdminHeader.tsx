'use client'

import { useAuth } from '@/providers/AuthProvider'
import { usePathname } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LogOut, User, Settings, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { NotificationBell } from '@/modules/notifications/NotificationBell'

const PATH_LABELS: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/torneos': 'Torneos',
  '/admin/torneos/nuevo': 'Nuevo torneo',
  '/admin/equipos': 'Equipos',
  '/admin/equipos/nuevo': 'Nuevo equipo',
  '/admin/jugadores': 'Jugadores',
  '/admin/jugadores/lista-negra': 'Lista Negra',
  '/admin/canchas': 'Canchas',
  '/admin/disciplinas': 'Disciplinas',
  '/admin/inscripciones': 'Inscripciones',
  '/admin/empleados': 'Empleados',
  '/admin/empleados/arbitros': 'Árbitros',
  '/admin/empleados/oficiales': 'Oficiales de Mesa',
  '/admin/empleados/fotografos': 'Fotógrafos',
  '/admin/configuracion': 'Configuración',
  '/admin/perfil': 'Mi Perfil',
  '/admin/mis-partidos': 'Mis Partidos',
  '/admin/torneos/partidos': 'Partidos',
  '/admin/usuarios': 'Usuarios',
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  master: 'Master',
  photographer: 'Fotógrafo',
  agente_mesa: 'Oficial de Mesa',
  arbitro: 'Árbitro',
}

function getBreadcrumbs(pathname: string) {
  const crumbs: { label: string; href: string }[] = [
    { label: 'Admin', href: '/admin' },
  ]

  if (pathname === '/admin') return crumbs

  const directLabel = PATH_LABELS[pathname]

  if (directLabel) {
    // Check for a known parent path
    const parts = pathname.split('/').filter(Boolean)
    if (parts.length > 2) {
      const parentPath = '/' + parts.slice(0, 2).join('/')
      const parentLabel = PATH_LABELS[parentPath]
      if (parentLabel) {
        crumbs.push({ label: parentLabel, href: parentPath })
      }
    }
    crumbs.push({ label: directLabel, href: pathname })
  } else {
    // Dynamic segment (e.g. /admin/torneos/[id])
    const parts = pathname.split('/').filter(Boolean)
    if (parts.length >= 2) {
      const parentPath = '/' + parts.slice(0, 2).join('/')
      const parentLabel = PATH_LABELS[parentPath]
      if (parentLabel) {
        crumbs.push({ label: parentLabel, href: parentPath })
      }
    }
    if (parts.length >= 3) {
      const grandParentPath = '/' + parts.slice(0, 3).join('/')
      const grandParentLabel = PATH_LABELS[grandParentPath]
      if (grandParentLabel && grandParentPath !== crumbs[crumbs.length - 1]?.href) {
        crumbs.push({ label: grandParentLabel, href: grandParentPath })
      } else if (!grandParentLabel) {
        crumbs.push({ label: 'Editar', href: pathname })
      }
    }
  }

  return crumbs
}

export function AdminHeader() {
  const { profile, signOut } = useAuth()
  const pathname = usePathname()
  const crumbs = getBreadcrumbs(pathname)
  const roleLabel = profile?.role ? (ROLE_LABELS[profile.role] ?? profile.role) : null

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-[#e8e6e1] bg-white px-6">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1 text-sm" aria-label="Breadcrumb">
        {crumbs.map((crumb, idx) => (
          <div key={crumb.href} className="flex items-center gap-1">
            {idx > 0 && (
              <ChevronRight className="h-3.5 w-3.5 text-[#c4c2cc] shrink-0" />
            )}
            {idx === crumbs.length - 1 ? (
              <span className="font-semibold text-[#0f0e13] text-[13px]">
                {crumb.label}
              </span>
            ) : (
              <Link
                href={crumb.href}
                className="text-[13px] text-[#9b99a6] hover:text-[#0f0e13] transition-colors"
              >
                {crumb.label}
              </Link>
            )}
          </div>
        ))}
      </nav>

      {/* Right side */}
      <div className="flex items-center gap-2">
        <NotificationBell variant="dark" />
        {roleLabel && (
          <Badge
            variant="outline"
            className="h-6 border-[#e8e6e1] bg-[#f7f6f4] text-[#6b6a72] text-[11px] font-medium px-2.5 hidden sm:flex"
          >
            {roleLabel}
          </Badge>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full p-0 hover:bg-transparent">
              <Avatar className="h-8 w-8 ring-2 ring-[#e8e6e1] hover:ring-[#ff3b2f] transition-all">
                <AvatarImage src={profile?.avatarUrl} alt={profile?.name} />
                <AvatarFallback className="bg-[#292548] text-white text-xs font-bold">
                  {profile?.name?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col gap-0.5">
                <p className="text-sm font-semibold leading-none">{profile?.name}</p>
                <p className="text-xs leading-none text-muted-foreground mt-0.5">
                  {profile?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/admin/perfil">
                <User className="mr-2 h-4 w-4" />
                Mi Perfil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/admin/configuracion">
                <Settings className="mr-2 h-4 w-4" />
                Configuración
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut()} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar Sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
