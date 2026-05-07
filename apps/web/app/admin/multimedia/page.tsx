import { ComingSoon } from '@/modules/admin/components/ComingSoon'
import { PageHeader } from '@/modules/admin/components/PageHeader'

export default function MultimediaPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Multimedia"
        description="Partidos asignados al fotógrafo y subida de archivos multimedia."
      />
      {/* TODO: conectar con API — partidos asignados con role=fotografo + upload de assets */}
      <ComingSoon message="Acá van a aparecer los partidos asignados al fotógrafo logueado." />
    </div>
  )
}
