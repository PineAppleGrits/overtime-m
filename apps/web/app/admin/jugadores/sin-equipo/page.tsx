import { ComingSoon } from '@/modules/admin/components/ComingSoon'
import { PageHeader } from '@/modules/admin/components/PageHeader'

export default function JugadoresSinEquipoPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Jugadores sin equipo"
        description="Usuarios con rol jugador que aún no están asignados a ningún equipo."
      />
      {/* TODO: conectar con API — listar profiles role=player sin TeamMember activo */}
      <ComingSoon message="Vamos a listar acá los jugadores que todavía no tienen equipo." />
    </div>
  )
}
