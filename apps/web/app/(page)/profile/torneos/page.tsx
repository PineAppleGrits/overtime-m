import Link from 'next/link'
import { Trophy, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import { getProfile } from '@/lib/auth/session'
import teamService from '@/modules/team/TeamService'
import registrationService from '@/modules/registration/RegistrationService'
import { redirect } from 'next/navigation'
import { cn } from '@/lib/utils'

type RegistrationStatus = 'pending' | 'approved' | 'rejected'

interface Registration {
  id: string
  status: RegistrationStatus
  rejectionReason?: string | null
  team?: { id: string; name: string; logoUrl?: string | null }
  tournament?: { id: string; name: string; slug: string }
  category?: { id: string; name: string; slug?: string | null }
  createdAt?: string
}

const STATUS_CONFIG: Record<RegistrationStatus, { label: string; icon: React.ElementType; className: string }> = {
  pending: {
    label: 'En revisión',
    icon: Clock,
    className: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  },
  approved: {
    label: 'Aprobada',
    icon: CheckCircle2,
    className: 'bg-green-500/20 text-green-300 border-green-500/30',
  },
  rejected: {
    label: 'Rechazada',
    icon: XCircle,
    className: 'bg-red-500/20 text-red-400 border-red-500/30',
  },
}

function RegistrationCard({ reg }: { reg: Registration }) {
  const status = STATUS_CONFIG[reg.status] ?? STATUS_CONFIG.pending
  const StatusIcon = status.icon
  const categorySlug = reg.category?.slug ?? reg.category?.id ?? ''
  const tournamentSlug = reg.tournament?.slug ?? reg.tournament?.id ?? ''

  return (
    <div className="rounded-xl border border-ot-light-blue/50 bg-ot-dark-blue/30 p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {reg.team?.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={reg.team.logoUrl}
              alt={reg.team.name}
              className="h-10 w-10 rounded-lg object-cover shrink-0"
            />
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/8 text-base font-bold text-white/40">
              {reg.team?.name?.charAt(0).toUpperCase() ?? '?'}
            </div>
          )}
          <div className="min-w-0">
            <p className="font-semibold text-white truncate">
              {reg.team?.name ?? 'Equipo desconocido'}
            </p>
            <p className="text-xs text-white/40 truncate">
              {reg.tournament?.name ?? ''}{reg.category?.name ? ` · ${reg.category.name}` : ''}
            </p>
          </div>
        </div>

        <span
          className={cn(
            'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium',
            status.className,
          )}
        >
          <StatusIcon className="h-3 w-3" />
          {status.label}
        </span>
      </div>

      {reg.status === 'rejected' && reg.rejectionReason && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">
          Motivo: {reg.rejectionReason}
        </div>
      )}

      {reg.status === 'pending' && tournamentSlug && categorySlug && (
        <Link
          href={`/torneos/${tournamentSlug}/${categorySlug}`}
          className="text-xs text-ot-orange hover:text-ot-orange/80 transition-colors"
        >
          Ver información de pago →
        </Link>
      )}
    </div>
  )
}

async function getMyRegistrations(): Promise<Registration[]> {
  try {
    const teams = await teamService.getMyTeams()
    const myTeams: { id: string }[] = Array.isArray(teams) ? teams : (teams?.data ?? [])
    if (myTeams.length === 0) return []

    const results = await Promise.all(
      myTeams.map((team) =>
        registrationService
          .getRegistrations({ teamId: team.id, limit: 50 })
          .then((res) => (res?.data ?? []) as Registration[])
          .catch(() => [] as Registration[]),
      ),
    )

    const seen = new Set<string>()
    return results.flat().filter((r) => {
      if (seen.has(r.id)) return false
      seen.add(r.id)
      return true
    })
  } catch {
    return []
  }
}

export default async function ProfileTournamentsPage() {
  const profile = await getProfile()
  if (!profile) redirect('/auth/login')

  const registrations = await getMyRegistrations()

  const pending = registrations.filter((r) => r.status === 'pending')
  const approved = registrations.filter((r) => r.status === 'approved')
  const rejected = registrations.filter((r) => r.status === 'rejected')

  return (
    <div className="space-y-6">
      <div>
        <h2 className="flex items-center gap-2 text-lg font-bold text-white">
          <Trophy className="h-5 w-5 text-ot-orange" />
          Mis torneos
        </h2>
        <p className="mt-0.5 text-sm text-white/50">
          Inscripciones de los equipos en los que participás.
        </p>
      </div>

      {registrations.length === 0 ? (
        <div className="rounded-xl border border-ot-light-blue/50 bg-ot-dark-blue/30 py-14 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/5">
            <Trophy className="h-6 w-6 text-white/20" />
          </div>
          <p className="text-sm font-medium text-white/50">Todavía no participás en ningún torneo</p>
          <p className="mt-1 text-xs text-white/30">
            Inscribite a un torneo desde la sección de torneos.
          </p>
          <Link
            href="/torneos"
            className="mt-5 inline-flex items-center gap-2 rounded-lg border border-ot-orange/40 px-4 py-2 text-sm text-ot-orange hover:bg-ot-orange/10 transition-colors"
          >
            Ver torneos disponibles
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {pending.length > 0 && (
            <section className="space-y-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-white/60 uppercase tracking-wider">
                <Clock className="h-4 w-4 text-amber-400" />
                En revisión ({pending.length})
              </h3>
              <div className="space-y-3">
                {pending.map((r) => <RegistrationCard key={r.id} reg={r} />)}
              </div>
            </section>
          )}

          {approved.length > 0 && (
            <section className="space-y-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-white/60 uppercase tracking-wider">
                <CheckCircle2 className="h-4 w-4 text-green-400" />
                Aprobadas ({approved.length})
              </h3>
              <div className="space-y-3">
                {approved.map((r) => <RegistrationCard key={r.id} reg={r} />)}
              </div>
            </section>
          )}

          {rejected.length > 0 && (
            <section className="space-y-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-white/60 uppercase tracking-wider">
                <AlertCircle className="h-4 w-4 text-red-400" />
                Rechazadas ({rejected.length})
              </h3>
              <div className="space-y-3">
                {rejected.map((r) => <RegistrationCard key={r.id} reg={r} />)}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
