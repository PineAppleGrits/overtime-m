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
  ExternalLink,
  MapPin,
} from 'lucide-react'
import { useState } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
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
  icon: React.ComponentType<{ className?: string }>
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
        label: 'Jugadores',
        icon: UserCog,
        subItems: [
          { label: 'Todos los jugadores', href: '/admin/jugadores' },
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
          { label: 'Todos los empleados', href: '/admin/empleados' },
          { label: 'Árbitros', href: '/admin/empleados/arbitros' },
          { label: 'Fotógrafos', href: '/admin/empleados/fotografos' },
          { label: 'Oficiales de mesa', href: '/admin/empleados/oficiales' },
        ],
      },
      {
        label: 'Canchas',
        href: '/admin/canchas',
        icon: MapPin,
        roles: ['admin', 'master'],
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
  // Tracks labels the user manually toggled (true = open, false = closed)
  const [manualOverrides, setManualOverrides] = useState<Record<string, boolean>>({})

  const canSee = (roles?: string[]) => {
    if (!roles) return true
    return !!profile && roles.includes(profile.role)
  }

  // Derived: open if pathname matches a child, OR user explicitly opened it.
  // Path-active always wins over a manual close (better UX than hiding the active section).
  const getIsExpanded = (label: string, subItems: SubItem[]) => {
    const pathActive = subItems.some(sub => pathname === sub.href)
    if (pathActive) return true
    return manualOverrides[label] ?? false
  }

  const toggleSubMenu = (label: string, currentExpanded: boolean) => {
    if (collapsed) {
      setCollapsed(false)
      setManualOverrides(prev => ({ ...prev, [label]: true }))
    } else {
      setManualOverrides(prev => ({ ...prev, [label]: !currentExpanded }))
    }
  }

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          'relative flex h-screen flex-col transition-all duration-300 select-none shrink-0',
          'bg-[#1a1730]',
          collapsed ? 'w-16' : 'w-64'
        )}
      >
        {/* Logo */}
        <div
          className={cn(
            'flex h-16 shrink-0 items-center border-b border-white/[0.07] px-4',
            collapsed ? 'justify-center' : 'justify-between'
          )}
        >
          {!collapsed && (
            <Link href="/admin" className="flex items-center gap-3 min-w-0">
              <Image src="/overtime_logo.png" alt="Overtime" width={30} height={16} className="shrink-0" />
              <div className="min-w-0">
                <p
                  className="text-[13px] font-bold text-white tracking-widest leading-none"
                  style={{ fontFamily: 'var(--font-din-display)' }}
                >
                  OVERTIME
                </p>
                <p className="text-[9px] text-[#ff3b2f] uppercase tracking-[0.25em] mt-0.5 leading-none">
                  Panel Admin
                </p>
              </div>
            </Link>
          )}
          {collapsed && (
            <Image src="/overtime_logo.png" alt="Overtime" width={26} height={14} />
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              'h-7 w-7 rounded-lg flex items-center justify-center text-white/25 hover:text-white/60 transition-all shrink-0',
              collapsed
                ? 'absolute -right-3.5 top-[22px] bg-[#1a1730] hover:bg-[#252140] border border-white/[0.12] rounded-full shadow-lg z-10'
                : 'hover:bg-white/[0.08]'
            )}
          >
            {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
          </button>
        </div>

        {/* Nav */}
        <ScrollArea className="flex-1 py-3">
          <nav className="flex flex-col px-2">
            {sidebarItems.map((section, sectionIdx) => {
              const visibleItems = section.items.filter(item => canSee(item.roles))
              if (visibleItems.length === 0) return null

              return (
                <div key={section.title} className={cn(sectionIdx > 0 && 'mt-4')}>
                  {!collapsed ? (
                    <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/25 flex items-center gap-2">
                      <span className="h-[3px] w-[3px] rounded-full bg-[#ff3b2f] inline-block shrink-0" />
                      {section.title}
                    </p>
                  ) : (
                    sectionIdx > 0 && (
                      <div className="my-2 mx-auto h-px w-7 bg-white/[0.07]" />
                    )
                  )}

                  <div className="flex flex-col gap-0.5">
                    {visibleItems.map(item => {
                      const hasSubItems = !!item.subItems
                      const isSubActive = hasSubItems
                        ? item.subItems!.some(sub => pathname === sub.href)
                        : false
                      const isActive = item.href
                        ? item.href === '/admin'
                          ? pathname === '/admin'
                          : pathname.startsWith(item.href)
                        : isSubActive
                      const isExpanded = hasSubItems ? getIsExpanded(item.label, item.subItems!) : false
                      const Icon = item.icon

                      const itemEl = hasSubItems ? (
                        <button
                          onClick={() => toggleSubMenu(item.label, isExpanded)}
                          className={cn(
                            'w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-all',
                            isSubActive
                              ? 'text-white bg-white/[0.09]'
                              : 'text-white/55 hover:text-white/85 hover:bg-white/[0.06]',
                            collapsed && 'justify-center px-0 w-10 mx-auto'
                          )}
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          {!collapsed && (
                            <>
                              <span className="flex-1 text-left">{item.label}</span>
                              <ChevronDown
                                className={cn(
                                  'h-3.5 w-3.5 text-white/25 transition-transform duration-200',
                                  isExpanded && 'rotate-180'
                                )}
                              />
                            </>
                          )}
                        </button>
                      ) : (
                        <Link
                          href={item.href!}
                          className={cn(
                            'flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-all',
                            isActive
                              ? 'bg-[#ff3b2f] text-white shadow-sm shadow-[#ff3b2f]/20'
                              : 'text-white/55 hover:text-white/85 hover:bg-white/[0.06]',
                            collapsed && 'justify-center px-0 w-10 mx-auto'
                          )}
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          {!collapsed && <span>{item.label}</span>}
                        </Link>
                      )

                      const withTooltip = collapsed ? (
                        <Tooltip key={item.href || item.label}>
                          <TooltipTrigger asChild>{itemEl}</TooltipTrigger>
                          <TooltipContent
                            side="right"
                            className="bg-[#0f0d1c] text-white border-white/10 text-xs"
                          >
                            {item.label}
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        itemEl
                      )

                      return (
                        <div key={item.href || item.label} className="flex flex-col">
                          {withTooltip}
                          {!collapsed && hasSubItems && isExpanded && (
                            <div className="ml-3 mt-0.5 mb-0.5 flex flex-col gap-0.5 border-l border-white/[0.07] pl-3">
                              {item.subItems!.map(sub => {
                                const isSubItemActive = pathname === sub.href
                                return (
                                  <Link
                                    key={sub.href}
                                    href={sub.href}
                                    className={cn(
                                      'rounded-md px-3 py-1.5 text-[12px] font-medium transition-all',
                                      isSubItemActive
                                        ? 'text-[#ff3b2f] bg-[#ff3b2f]/[0.12]'
                                        : 'text-white/45 hover:text-white/75 hover:bg-white/[0.05]'
                                    )}
                                  >
                                    {sub.label}
                                  </Link>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </nav>
        </ScrollArea>

        {/* Footer */}
        <div className="shrink-0 border-t border-white/[0.07] p-2">
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/"
                  className="flex h-9 w-10 mx-auto items-center justify-center rounded-lg text-white/25 hover:text-white/55 hover:bg-white/[0.06] transition-all"
                >
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-[#0f0d1c] text-white border-white/10 text-xs">
                Ir al sitio
              </TooltipContent>
            </Tooltip>
          ) : (
            <Link
              href="/"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-[12px] text-white/30 hover:text-white/55 hover:bg-white/[0.06] transition-all"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Volver al sitio</span>
            </Link>
          )}
        </div>
      </aside>
    </TooltipProvider>
  )
}
