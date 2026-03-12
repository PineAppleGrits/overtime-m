import sportService from '@/modules/sport/SportService'
import { DisciplinasContent } from '@/modules/admin/components/disciplinas/DisciplinasContent'

export default async function DisciplinasPage() {
  let initialData: { data: never[]; error: string | null } = {
    data: [],
    error: null,
  }

  try {
    const response = await sportService.getSports()
    initialData.data = response.data ?? response ?? []
  } catch {
    initialData.error = 'Error al cargar disciplinas'
  }

  return <DisciplinasContent initialData={initialData} />
}
