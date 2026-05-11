'use client'

import { useState } from 'react'
import { MatchPreview } from '@/modules/common/components/MatchPreview'
import type { MatchPreviewData } from '@/modules/common/components/MatchPreview/types'

type Round = {
  name: string
  date: string
  matches: MatchPreviewData[]
}

export function FixtureView({ rounds }: { rounds: Round[] }) {
  // Start on the last round that has results
  const lastPlayedIdx = rounds.reduce((acc, round, idx) => {
    const hasResults = round.matches.some(
      (m) => m.team1Score !== undefined && m.team2Score !== undefined
    )
    return hasResults ? idx : acc
  }, 0)

  const [activeRound, setActiveRound] = useState(lastPlayedIdx)
  const currentRound = rounds[activeRound]

  return (
    <div className="ot-container">
      {/* Banner */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/banners/basket_capital.webp"
        alt="Banner de @basket.capital"
        className="w-full mb-6 rounded-sm"
      />

      <h3 className="text-center text-ot-orange font-semibold uppercase font-din-display text-lg mb-4">
        Fixture
      </h3>

      {/* Round selector — PlayoffPicker style */}
      <div className="flex w-full h-[50px] px-4 sm:px-6 gap-3 sm:gap-4 rounded-sm bg-[#2b161f] items-center mb-6">
        <button
          onClick={() => setActiveRound(Math.max(0, activeRound - 1))}
          disabled={activeRound === 0}
          className="text-ot-orange text-xl font-bold disabled:opacity-20 transition-colors shrink-0 cursor-pointer"
          aria-label="Fecha anterior"
        >
          ‹
        </button>
        <div className="flex-1 min-w-0 h-full flex justify-start overflow-x-auto">
          {rounds.map((round, idx) => (
            <button
              key={round.name}
              onClick={() => setActiveRound(idx)}
              className={`w-[130px] shrink-0 h-full flex items-center justify-center uppercase font-din-display text-sm sm:text-base font-bold cursor-pointer pt-1 transition-colors ${
                activeRound === idx
                  ? 'text-ot-orange'
                  : 'text-[#aa2c28] hover:text-ot-orange'
              }`}
              style={
                activeRound === idx
                  ? {
                      background:
                        'linear-gradient(180deg, rgba(255, 59, 47, 0) 0%, rgba(255, 59, 47, 0.2) 100%)',
                    }
                  : undefined
              }
            >
              {round.name}
            </button>
          ))}
        </div>
        <button
          onClick={() => setActiveRound(Math.min(rounds.length - 1, activeRound + 1))}
          disabled={activeRound === rounds.length - 1}
          className="text-ot-orange text-xl font-bold disabled:opacity-20 transition-colors shrink-0 cursor-pointer"
          aria-label="Fecha siguiente"
        >
          ›
        </button>
      </div>

      {/* Match cards using MatchPreview component */}
      {currentRound ? (
        currentRound.matches.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 justify-items-center">
            {currentRound.matches.map((match) => (
              <MatchPreview key={match.id} match={match} />
            ))}
          </div>
        ) : (
          <p className="py-10 text-center text-sm text-white/40">
            No hay partidos para esta fecha
          </p>
        )
      ) : null}
    </div>
  )
}
