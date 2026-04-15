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
}: {
  categoryName: string
  tournamentSlug: string
  categorySlug: string
  isMyTeamPlaying: boolean
  myTeamId?: string
  categoryId: string
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
        <MyTeamTab teamId={myTeamId} categoryId={categoryId} />
      )}
    </section>
  )
}
