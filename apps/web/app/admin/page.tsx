import { Suspense } from 'react'
import {
  Trophy,
  Users,
  UserCog,
  MapPin,
  ClipboardList,
  Dumbbell,
  ArrowRight,
  Plus,
} from 'lucide-react'
import Link from 'next/link'
import { DashboardStats } from '@/modules/admin/components/DashboardStats'
import { DashboardStatsSkeleton } from '@/modules/admin/components/DashboardStatsSkeleton'

const quickActions = [
  {
    label: 'Nuevo torneo',
    description: 'Crear y configurar un torneo',
    href: '/admin/torneos/nuevo',
    icon: Trophy,
    color: '#ff3b2f',
    bg: '#fff1f0',
  },
  {
    label: 'Registrar equipo',
    description: 'Añadir un equipo manualmente',
    href: '/admin/equipos/nuevo',
    icon: Users,
    color: '#292548',
    bg: '#f0effe',
  },
  {
    label: 'Inscripciones',
    description: 'Revisar solicitudes pendientes',
    href: '/admin/inscripciones',
    icon: ClipboardList,
    color: '#92400e',
    bg: '#fffbeb',
  },
  {
    label: 'Jugadores',
    description: 'Gestionar el padrón de jugadores',
    href: '/admin/jugadores',
    icon: UserCog,
    color: '#166534',
    bg: '#f0fdf4',
  },
  {
    label: 'Canchas',
    description: 'Administrar sedes y canchas',
    href: '/admin/canchas',
    icon: MapPin,
    color: '#0369a1',
    bg: '#f0f9ff',
  },
  {
    label: 'Disciplinas',
    description: 'Configurar deportes disponibles',
    href: '/admin/disciplinas',
    icon: Dumbbell,
    color: '#7c3aed',
    bg: '#faf5ff',
  },
]

export default async function AdminDashboardPage() {
  return (
    <div className="max-w-6xl space-y-8">
      {/* Header - static, renders immediately */}
      <div className="flex items-start justify-between">
        <div>
          <h1
            className="text-2xl font-bold text-[#0f0e13] tracking-tight"
            style={{ fontFamily: 'var(--font-din-display)' }}
          >
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-[#9b99a6]">
            Resumen general de la plataforma Overtime
          </p>
        </div>
        <Link
          href="/admin/torneos/nuevo"
          className="inline-flex items-center gap-2 rounded-lg bg-[#ff3b2f] px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-[#ff3b2f]/20 transition-all hover:bg-[#e0332a] hover:-translate-y-0.5 hover:shadow-md"
        >
          <Plus className="h-4 w-4" />
          Nuevo torneo
        </Link>
      </div>

      {/* Stats — streamed via Suspense */}
      <section>
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#9b99a6]">
          Estadísticas
        </p>
        <Suspense fallback={<DashboardStatsSkeleton />}>
          <DashboardStats />
        </Suspense>
      </section>

      {/* Quick actions — static, renders immediately */}
      <section>
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#9b99a6]">
          Accesos rápidos
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {quickActions.map(action => {
            const Icon = action.icon
            return (
              <Link
                key={action.href}
                href={action.href}
                className="group flex items-center gap-4 rounded-xl border border-[#e8e6e1] bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 hover:border-[#d4d1cc]"
              >
                <div
                  className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110"
                  style={{ backgroundColor: action.bg }}
                >
                  <Icon className="h-5 w-5" style={{ color: action.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-[#0f0e13] leading-none">
                    {action.label}
                  </p>
                  <p className="text-[11px] text-[#9b99a6] mt-1 leading-none">
                    {action.description}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-[#c4c2cc] shrink-0 transition-all duration-200 group-hover:text-[#9b99a6] group-hover:translate-x-0.5" />
              </Link>
            )
          })}
        </div>
      </section>
    </div>
  )
}
