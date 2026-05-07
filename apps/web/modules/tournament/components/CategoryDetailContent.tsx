'use client'

import { useState } from 'react'
import { CategoryTabs } from './CategoryTabs'
import { StandingsTable } from './StandingsTable'
import { FixtureView } from './FixtureView'
import { MyTeamTab } from './MyTeamTab'
import type {
  CategoryFixtureResponse,
  CategoryStandingsResponse,
} from '@/modules/tournament/CategoryService'

interface CategoryDetailContentProps {
  categoryName: string
  tournamentSlug: string
  categorySlug: string
  isMyTeamPlaying: boolean
  myTeamId?: string
  categoryId: string
  canManageTeam?: boolean
  standings: CategoryStandingsResponse
  fixture: CategoryFixtureResponse
}

export function CategoryDetailContent({
  categoryName: _categoryName,
  tournamentSlug: _tournamentSlug,
  categorySlug: _categorySlug,
  isMyTeamPlaying,
  myTeamId,
  categoryId,
  canManageTeam = false,
  standings,
  fixture,
}: CategoryDetailContentProps) {
  const [activeTab, setActiveTab] = useState('fixture')

  const tabs = [
    { key: 'fixture', label: 'Fixture' },
    { key: 'posiciones', label: 'Posiciones' },
    { key: 'mi-equipo', label: 'Mi Equipo', hidden: !isMyTeamPlaying },
  ]

  const hasStandings = standings.zones.some((z) => z.standings.length > 0)
  const hasFixture = fixture.rounds.length > 0

  return (
    <section>
      <CategoryTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === 'posiciones' && (
        <div className="ot-container">
          {hasStandings ? (
            standings.zones.map((zone) => (
              <StandingsTable
                key={zone.id}
                standings={zone.standings}
                zoneName={standings.zones.length > 1 ? zone.name : undefined}
              />
            ))
          ) : (
            <p className="py-10 text-center text-sm text-white/40">
              Todavía no hay partidos finalizados para armar la tabla.
            </p>
          )}
        </div>
      )}

      {activeTab === 'fixture' && (
        hasFixture ? (
          <FixtureView rounds={fixture.rounds} />
        ) : (
          <div className="ot-container">
            <p className="py-10 text-center text-sm text-white/40">
              Todavía no hay fixture publicado para esta categoría.
            </p>
          </div>
        )
      )}

      {activeTab === 'mi-equipo' && myTeamId && (
        <div className="ot-container py-6">
          <MyTeamTab
            teamId={myTeamId}
            categoryId={categoryId}
            canManage={canManageTeam}
          />
        </div>
      )}
    </section>
  )
}
