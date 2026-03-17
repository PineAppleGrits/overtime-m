'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Trophy,
  Users,
  UserCog,
  Dumbbell,
  Settings,
  UserCircle,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  CalendarCheck,
  Camera,
  Briefcase,
  UsersRound,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import Image from 'next/image'
import { useAuth } from '@/providers/AuthProvider'

type SubItem = {
  label: string
  href: string
}

type MenuItem = {
  label: string
  href?: string
  icon: any
  subItems?: SubItem[]
  roles?: string[]
}

type SidebarSection = {
  title: string
  items: MenuItem[]
}

const sidebarItems: SidebarSection[] = [
  {
    title: 'General',
    items: [
      { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
      { label: 'Mis Partidos', href: '/admin/mis-partidos', icon: CalendarCheck },
      {
        label: 'Multimedia',
        href: '/admin/multimedia',
        icon: Camera,
        roles: ['admin', 'master', 'photographer'],
      },
    ],
  },
  {
    title: 'Gestión',
    items: [
      { label: 'Torneos', href: '/admin/torneos', icon: Trophy },
      { label: 'Equipos', href: '/admin/equipos', icon: Users },
      {
        label: 'Usuarios',
        icon: UserCog,
        subItems: [
          { label: 'Jugadores', href: '/admin/jugadores' },
          { label: 'Lista Negra', href: '/admin/jugadores/lista-negra' },
        ],
      },
    ],
  },
  {
    title: 'Organización',
    items: [
      {
        label: 'Todos los usuarios',
        href: '/admin/usuarios',
        icon: UsersRound,
        roles: ['admin', 'master'],
      },
      {
        label: 'Empleados',
        icon: Briefcase,
        roles: ['admin', 'master'],
        subItems: [
          { label: 'Oficiales de mesa', href: '/admin/empleados/oficiales' },
          { label: 'Árbitros', href: '/admin/empleados/arbitros' },
          { label: 'Fotógrafos', href: '/admin/empleados/fotografos' },
        ],
      },
      { label: 'Disciplinas', href: '/admin/disciplinas', icon: Dumbbell },
    ],
  },
  {
    title: 'Sistema',
    items: [
      {
        label: 'Configuración',
        href: '/admin/configuracion',
        icon: Settings,
        roles: ['admin', 'master'],
      },
      { label: 'Mi Perfil', href: '/admin/perfil', icon: UserCircle },
    ],
  },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const { profile } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({})

  const canSee = (roles?: string[]) => {
    if (!roles) return true
    return !!profile && roles.includes(profile.role)
  }

  useEffect(() => {
    const newExpandedMenus = { ...expandedMenus }
    let changed = false
    sidebarItems.forEach(section => {
      section.items.forEach(item => {
        if (item.subItems) {
          const isActive = item.subItems.some(sub => pathname.startsWith(sub.href))
          if (isActive && !newExpandedMenus[item.label]) {
            newExpandedMenus[item.label] = true
            changed = true
          }
        }
      })
    })
    if (changed) setExpandedMenus(newExpandedMenus)
  }, [pathname, expandedMenus])

  const toggleSubMenu = (label: string) => {
    if (collapsed) {
      setCollapsed(false)
      setExpandedMenus(prev => ({ ...prev, [label]: true }))
    } else {
      setExpandedMenus(prev => ({ ...prev, [label]: !prev[label] }))
    }
  }

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
            {sidebarItems.map((section, sectionIdx) => {
              const visibleItems = section.items.filter(item => canSee(item.roles))
              if (visibleItems.length === 0) return null

              return (
                <div key={section.title}>
                  {sectionIdx > 0 && <Separator className="my-2" />}
                  {!collapsed && (
                    <p className="mb-1 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {section.title}
                    </p>
                  )}
                  {visibleItems.map(item => {
                    const hasSubItems = !!item.subItems
                    const isSubMenuActive = hasSubItems
                      ? item.subItems!.some(sub => pathname.startsWith(sub.href))
                      : false
                    const isActive = item.href
                      ? item.href === '/admin'
                        ? pathname === '/admin'
                        : pathname.startsWith(item.href)
                      : isSubMenuActive

                    const Icon = item.icon
                    const isExpanded = expandedMenus[item.label]

                    const linkContent = hasSubItems ? (
                      <button
                        key={item.label}
                        onClick={() => toggleSubMenu(item.label)}
                        className={cn(
                          'flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                          isActive && !isExpanded
                            ? 'bg-primary/10 text-primary'
                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                          collapsed && 'justify-center px-2'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="h-4 w-4 shrink-0" />
                          {!collapsed && <span>{item.label}</span>}
                        </div>
                        {!collapsed && (
                          <ChevronDown
                            className={cn(
                              'h-4 w-4 transition-transform duration-200',
                              isExpanded && 'rotate-180'
                            )}
                          />
                        )}
                      </button>
                    ) : (
                      <Link
                        key={item.href || item.label}
                        href={item.href || '#'}
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

                    const renderItem = collapsed ? (
                      <Tooltip key={item.href || item.label}>
                        <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                        <TooltipContent side="right">
                          <p>{item.label}</p>
                        </TooltipContent>
                      </Tooltip>
                    ) : linkContent

                    return (
                      <div key={item.href || item.label} className="flex flex-col gap-1">
                        {renderItem}
                        {!collapsed && hasSubItems && isExpanded && (
                          <div className="ml-6 flex flex-col gap-1 border-l pl-2">
                            {item.subItems!.map(subItem => {
                              const isSubActive = pathname.startsWith(subItem.href)
                              return (
                                <Link
                                  key={subItem.href}
                                  href={subItem.href}
                                  className={cn(
                                    'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                                    isSubActive
                                      ? 'bg-primary text-primary-foreground'
                                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                                  )}
                                >
                                  <span>{subItem.label}</span>
                                </Link>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            })}
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
