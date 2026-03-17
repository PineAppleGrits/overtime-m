import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import sportService from '@/modules/sport/SportService'
import { CreateTeamWizard } from '@/modules/profile/components/teams/CreateTeamWizard'

async function getSports() {
  try {
    const res = await sportService.getSports()
    const raw = res?.data ?? res ?? []
    return Array.isArray(raw) ? raw : (raw.data ?? [])
  } catch {
    return []
  }
}

export default async function NuevoEquipoPage() {
  const sports = await getSports()

  return (
    <div>
      <div className="mb-6 flex items-center gap-2">
        <Link
          href="/profile/equipos"
          className="flex items-center gap-1 text-sm text-white/40 hover:text-white/70 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Mis equipos
        </Link>
      </div>

      <CreateTeamWizard sports={sports} />
    </div>
  )
}
