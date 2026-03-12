import sportService from '@/modules/sport/SportService'
import { NewTeamContent } from '@/modules/admin/components/equipos/NewTeamContent'

export default async function NewTeamPage() {
  let sports: { id: string; name: string }[] = []

  try {
    const response = await sportService.getSports()
    sports = response.data ?? response ?? []
  } catch {
    // Sports will be empty, form will show empty select
  }

  return <NewTeamContent sports={sports} />
}
