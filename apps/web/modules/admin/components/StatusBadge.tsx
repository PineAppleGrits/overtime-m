import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type StatusVariant = 'default' | 'success' | 'warning' | 'danger' | 'info'

const statusColors: Record<StatusVariant, string> = {
  default: 'bg-[#f0ede8] text-[#6b6a72]',
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-700',
  danger: 'bg-red-50 text-red-700',
  info: 'bg-blue-50 text-blue-700',
}

const tournamentStatusMap: Record<string, { label: string; variant: StatusVariant }> = {
  DRAFT: { label: 'Borrador', variant: 'default' },
  PUBLISHED: { label: 'Publicado', variant: 'info' },
  INSCRIPTION_OPEN: { label: 'Inscripciones abiertas', variant: 'success' },
  INSCRIPTION_CLOSED: { label: 'Inscripciones cerradas', variant: 'warning' },
  IN_PROGRESS: { label: 'Armando fixture', variant: 'info' },
  PLAYING: { label: 'En juego', variant: 'info' },
  FINISHED: { label: 'Finalizado', variant: 'default' },
  ARCHIVED: { label: 'Archivado', variant: 'default' },
}

const registrationStatusMap: Record<string, { label: string; variant: StatusVariant }> = {
  pending: { label: 'Pendiente', variant: 'warning' },
  approved: { label: 'Aprobada', variant: 'success' },
  rejected: { label: 'Rechazada', variant: 'danger' },
  cancelled: { label: 'Cancelada', variant: 'default' },
}

const paymentStatusMap: Record<string, { label: string; variant: StatusVariant }> = {
  pending: { label: 'Pendiente', variant: 'warning' },
  paid: { label: 'Pagado', variant: 'success' },
  refunded: { label: 'Reembolsado', variant: 'info' },
}

const matchStatusMap: Record<string, { label: string; variant: StatusVariant }> = {
  programado: { label: 'Programado', variant: 'info' },
  en_curso: { label: 'En curso', variant: 'warning' },
  suspendido: { label: 'Suspendido', variant: 'danger' },
  cancelado: { label: 'Cancelado', variant: 'danger' },
  reprogramado: { label: 'Reprogramado', variant: 'warning' },
  finalizado: { label: 'Finalizado', variant: 'success' },
}

const employeeRoleMap: Record<string, { label: string; variant: StatusVariant }> = {
  arbitro: { label: 'Árbitro', variant: 'info' },
  fotografo: { label: 'Multimedia', variant: 'success' },
  agente_mesa: { label: 'Agente de Mesa', variant: 'warning' },
}

const activeStatusMap: Record<string, { label: string; variant: StatusVariant }> = {
  active: { label: 'Activo', variant: 'success' },
  inactive: { label: 'Inactivo', variant: 'default' },
}

const TYPE_MAPS = {
  tournament: tournamentStatusMap,
  registration: registrationStatusMap,
  payment: paymentStatusMap,
  match: matchStatusMap,
  employee: employeeRoleMap,
  active: activeStatusMap,
} as const

interface StatusBadgeProps {
  status: string
  type: keyof typeof TYPE_MAPS
  className?: string
}

export function StatusBadge({ status, type, className }: StatusBadgeProps) {
  const config = TYPE_MAPS[type]?.[status] ?? { label: status, variant: 'default' as StatusVariant }

  return (
    <Badge variant="outline" className={cn(statusColors[config.variant], 'border-0 font-medium', className)}>
      {config.label}
    </Badge>
  )
}
