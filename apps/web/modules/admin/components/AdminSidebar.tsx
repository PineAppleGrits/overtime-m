'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Trophy,
  Users,
  UserCog,
  MapPin,
  Dumbbell,
  Settings,
  UserCircle,
  ShieldBan,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  CalendarCheck,
} from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import Image from 'next/image'

const sidebarItems = [
  {
    title: 'General',
    items: [
      { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
      { label: 'Mis Partidos', href: '/admin/mis-partidos', icon: CalendarCheck },
    ],
  },
  {
    title: 'Gestión',
    items: [
      { label: 'Torneos', href: '/admin/torneos', icon: Trophy },
      { label: 'Equipos', href: '/admin/equipos', icon: Users },
      { label: 'Jugadores', href: '/admin/jugadores', icon: UserCog },
      { label: 'Lista Negra', href: '/admin/jugadores/lista-negra', icon: ShieldBan },
      { label: 'Inscripciones', href: '/admin/inscripciones', icon: ClipboardList },
    ],
  },
  {
    title: 'Organización',
    items: [
      { label: 'Empleados', href: '/admin/empleados', icon: UserCog },
      { label: 'Canchas', href: '/admin/canchas', icon: MapPin },
      { label: 'Disciplinas', href: '/admin/disciplinas', icon: Dumbbell },
    ],
  },
  {
    title: 'Sistema',
    items: [
      { label: 'Configuración', href: '/admin/configuracion', icon: Settings },
      { label: 'Mi Perfil', href: '/admin/perfil', icon: UserCircle },
    ],
  },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          'relative flex h-screen flex-col border-r bg-card transition-all duration-300',
          collapsed ? 'w-16' : 'w-64'
        )}
      >
        <div className={cn('flex h-14 items-center border-b px-4', collapsed ? 'justify-center' : 'gap-2')}>
          {!collapsed && (
            <Link href="/admin" className="flex items-center gap-2">
              <Image src="/overtime_logo.png" alt="Overtime" width={32} height={17} />
              <span className="text-lg font-bold text-foreground">Admin</span>
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            className={cn('h-8 w-8 shrink-0', !collapsed && 'ml-auto')}
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        <ScrollArea className="flex-1 py-2">
          <nav className="flex flex-col gap-1 px-2">
            {sidebarItems.map((section, sectionIdx) => (
              <div key={section.title}>
                {sectionIdx > 0 && <Separator className="my-2" />}
                {!collapsed && (
                  <p className="mb-1 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {section.title}
                  </p>
                )}
                {section.items.map((item) => {
                  const isActive =
                    item.href === '/admin'
                      ? pathname === '/admin'
                      : pathname.startsWith(item.href)
                  const Icon = item.icon

                  const linkContent = (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                        collapsed && 'justify-center px-2'
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.label}</span>}
                    </Link>
                  )

                  if (collapsed) {
                    return (
                      <Tooltip key={item.href}>
                        <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                        <TooltipContent side="right">
                          <p>{item.label}</p>
                        </TooltipContent>
                      </Tooltip>
                    )
                  }

                  return linkContent
                })}
              </div>
            ))}
          </nav>
        </ScrollArea>

        <div className="border-t p-2">
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/"
                  className="flex items-center justify-center rounded-md px-2 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">Volver al sitio</TooltipContent>
            </Tooltip>
          ) : (
            <Link
              href="/"
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Volver al sitio</span>
            </Link>
          )}
        </div>
      </aside>
    </TooltipProvider>
  )
}
