import { Trophy, Users, UserCog, ClipboardList, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import tournamentService from '@/modules/tournament/TournamentService'
import teamService from '@/modules/team/TeamService'
import playerService from '@/modules/player/PlayerService'
import registrationService from '@/modules/registration/RegistrationService'

async function fetchDashboardStats() {
  const [tournamentsRes, teamsRes, playersRes, pendingRes] = await Promise.allSettled([
    tournamentService.getTournaments({ page: 1, limit: 1 }),
    teamService.getTeams({ page: 1, limit: 1 }),
    playerService.getPlayers({ page: 1, limit: 1 }),
    registrationService.getRegistrations({ page: 1, limit: 1, status: 'pending' }),
  ])

  const getTotal = (res: PromiseSettledResult<unknown>): number | null => {
    if (res.status === 'rejected') return null
    const raw = res.value as {
      meta?: { total?: number }
      data?: { meta?: { total?: number } } | { total?: number }
    }
    return raw?.meta?.total ?? (raw?.data as { meta?: { total?: number } })?.meta?.total ?? null
  }

  const allFailed = [tournamentsRes, teamsRes, playersRes, pendingRes].every(
    r => r.status === 'rejected'
  )

  return {
    tournaments: getTotal(tournamentsRes),
    teams: getTotal(teamsRes),
    players: getTotal(playersRes),
    pendingRegistrations: getTotal(pendingRes),
    allFailed,
  }
}

export async function DashboardStats() {
  const stats = await fetchDashboardStats()

  if (stats.allFailed) {
    return (
      <div className="rounded-xl border border-destructive/20 bg-red-50 p-5 flex items-start gap-4">
        <div className="size-9 rounded-full bg-destructive/10 flex items-center justify-center shrink-0 mt-0.5">
          <AlertTriangle className="size-4.5 text-destructive" />
        </div>
        <div>
          <p className="font-semibold text-destructive text-sm">
            No se pudieron cargar las estadísticas
          </p>
          <p className="text-sm text-red-600/70 mt-1">
            Ocurrió un error al conectar con el servidor. Intentá recargar la página.
          </p>
        </div>
      </div>
    )
  }

  const items = [
    {
      label: 'Torneos',
      value: stats.tournaments,
      icon: Trophy,
      iconColor: '#ff3b2f',
      iconBg: '#fff1f0',
      href: '/admin/torneos',
      highlight: false,
    },
    {
      label: 'Equipos',
      value: stats.teams,
      icon: Users,
      iconColor: '#292548',
      iconBg: '#f0effe',
      href: '/admin/equipos',
      highlight: false,
    },
    {
      label: 'Jugadores',
      value: stats.players,
      icon: UserCog,
      iconColor: '#166534',
      iconBg: '#f0fdf4',
      href: '/admin/jugadores',
      highlight: false,
    },
    {
      label: 'Inscripciones pendientes',
      value: stats.pendingRegistrations,
      icon: ClipboardList,
      iconColor: '#92400e',
      iconBg: '#fffbeb',
      href: '/admin/inscripciones',
      highlight: stats.pendingRegistrations !== null && stats.pendingRegistrations > 0,
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map(item => {
        const Icon = item.icon
        return (
          <a
            key={item.label}
            href={item.href}
            className={cn(
              'group relative rounded-xl border bg-white p-5 shadow-sm transition-all duration-200',
              'hover:shadow-md hover:-translate-y-0.5',
              item.highlight ? 'border-amber-200' : 'border-[#e8e6e1]'
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9b99a6]">
                  {item.label}
                </p>
                <p
                  className="mt-2 text-3xl font-bold text-[#0f0e13] tabular-nums"
                  style={{ fontFamily: 'var(--font-din-display)' }}
                >
                  {item.value !== null ? item.value.toLocaleString('es-AR') : '—'}
                </p>
              </div>
              <div
                className="size-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110"
                style={{ backgroundColor: item.iconBg }}
              >
                <Icon className="size-5" style={{ color: item.iconColor }} />
              </div>
            </div>
            {item.highlight && (
              <div className="mt-3 flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-[11px] text-amber-600 font-medium">Requieren atención</span>
              </div>
            )}
          </a>
        )
      })}
    </div>
  )
}
