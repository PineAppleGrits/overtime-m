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
  const [activeTab, setActiveTab] = useState('posiciones')

  const tabs = [
    { key: 'posiciones', label: 'Posiciones' },
    { key: 'fixture', label: 'Fixture' },
    { key: 'mi-equipo', label: 'Mi Equipo', hidden: !isMyTeamPlaying },
  ]

  return (
    <section className="mt-10">
      <CategoryTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === 'posiciones' && (
        <StandingsTable standings={standingsData} />
      )}

      {activeTab === 'fixture' && <FixtureView rounds={fixtureData.rounds} />}

      {activeTab === 'mi-equipo' && myTeamId && (
        <MyTeamTab teamId={myTeamId} categoryId={categoryId} />
      )}
    </section>
  )
}
