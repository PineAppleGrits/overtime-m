import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type StatusVariant = 'default' | 'success' | 'warning' | 'danger' | 'info'

const statusColors: Record<StatusVariant, string> = {
  default: 'bg-secondary text-secondary-foreground',
  success: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
  warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
  danger: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
  info: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
}

const tournamentStatusMap: Record<string, { label: string; variant: StatusVariant }> = {
  draft: { label: 'Borrador', variant: 'default' },
  published: { label: 'Publicado', variant: 'success' },
  archived: { label: 'Archivado', variant: 'warning' },
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
  fotografo: { label: 'Fotógrafo', variant: 'success' },
  agente_mesa: { label: 'Agente de Mesa', variant: 'warning' },
}

interface StatusBadgeProps {
  status: string
  type: 'tournament' | 'registration' | 'payment' | 'match' | 'employee'
  className?: string
}

export function StatusBadge({ status, type, className }: StatusBadgeProps) {
  const maps: Record<string, Record<string, { label: string; variant: StatusVariant }>> = {
    tournament: tournamentStatusMap,
    registration: registrationStatusMap,
    payment: paymentStatusMap,
    match: matchStatusMap,
    employee: employeeRoleMap,
  }

  const map = maps[type]
  const config = map?.[status] ?? { label: status, variant: 'default' as StatusVariant }

  return (
    <Badge variant="outline" className={cn(statusColors[config.variant], 'border-0', className)}>
      {config.label}
    </Badge>
  )
}
