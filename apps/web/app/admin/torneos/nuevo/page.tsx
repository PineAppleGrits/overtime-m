import sportService from '@/modules/sport/SportService'
import { NewTournamentContent } from '@/modules/admin/components/torneos/NewTournamentContent'

export default async function NewTournamentPage() {
  let sports: { id: string; name: string; code: string }[] = []
  try {
    const response = await sportService.getSports()
    sports = response.data ?? response ?? []
  } catch {
    /* Sports will be empty — form will still work */
  }
  return <NewTournamentContent sports={sports} />
}
