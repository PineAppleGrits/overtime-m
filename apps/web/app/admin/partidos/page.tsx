import adminMatchesMock from '@/mock/admin-matches.json'
import { MatchCalendar, type AdminMatch } from './MatchCalendar'

export const dynamic = 'force-dynamic'

export default async function PartidosPage() {
  // TODO: conectar con API — matchService.getMatches({ limit: 200 })
  const matches = adminMatchesMock as AdminMatch[]

  return (
    <div className="-m-6 lg:-m-8 overflow-hidden" style={{ height: 'calc(100vh - 56px)' }}>
      <MatchCalendar initialMatches={matches} />
    </div>
  )
}
