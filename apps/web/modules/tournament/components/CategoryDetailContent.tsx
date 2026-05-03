'use client'

import { useState } from 'react'
import { CategoryTabs } from './CategoryTabs'
import { StandingsTable } from './StandingsTable'
import { FixtureView } from './FixtureView'
import { MyTeamTab } from './MyTeamTab'
import standingsData from '@/mock/category-standings.json'
import fixtureData from '@/mock/category-fixture.json'

// TODO: conectar con API para obtener datos reales

export function CategoryDetailContent({
  categoryName: _categoryName,
  tournamentSlug: _tournamentSlug,
  categorySlug: _categorySlug,
  isMyTeamPlaying,
  myTeamId,
  categoryId,
  canManageTeam = false,
}: {
  categoryName: string
  tournamentSlug: string
  categorySlug: string
  isMyTeamPlaying: boolean
  myTeamId?: string
  categoryId: string
  canManageTeam?: boolean
}) {
  const [activeTab, setActiveTab] = useState('fixture')

  const tabs = [
    { key: 'fixture', label: 'Fixture' },
    { key: 'posiciones', label: 'Posiciones' },
    { key: 'mi-equipo', label: 'Mi Equipo', hidden: !isMyTeamPlaying },
  ]

  return (
    <section>
      <CategoryTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === 'posiciones' && (
        <div className="ot-container">
          {standingsData.zones.map((zone) => (
            <StandingsTable
              key={zone.name}
              standings={zone.standings}
              zoneName={standingsData.zones.length > 1 ? zone.name : undefined}
            />
          ))}
        </div>
      )}

      {activeTab === 'fixture' && <FixtureView rounds={fixtureData.rounds} />}

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
