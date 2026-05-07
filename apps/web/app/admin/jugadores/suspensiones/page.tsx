import { ComingSoon } from '@/modules/admin/components/ComingSoon'
import { PageHeader } from '@/modules/admin/components/PageHeader'

export default function SuspensionesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Suspensiones"
        description="Sanciones activas y resueltas sobre jugadores y equipos."
      />
      {/* TODO: armar listado/filtros usando sanctionsService.list() — RN-002, RN-003 */}
      <ComingSoon message="Vamos a listar acá las suspensiones (SanctionsService ya está conectado)." />
    </div>
  )
}
