'use client'

import { useState } from 'react'
import { MapPin, Clock, Calendar } from 'lucide-react'

type Team = {
  name: string
  score: number | null
}

type Match = {
  id: string
  homeTeam: Team
  awayTeam: Team
  status: string
  time: string
  venue: string
}

type Round = {
  name: string
  date: string
  matches: Match[]
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00')
  return date.toLocaleDateString('es-AR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

export function FixtureView({ rounds }: { rounds: Round[] }) {
  const [activeRound, setActiveRound] = useState(0)

  const currentRound = rounds[activeRound]

  return (
    <div>
      {/* Round selector */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-4">
        {rounds.map((round, idx) => (
          <button
            key={round.name}
            onClick={() => setActiveRound(idx)}
            className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
              activeRound === idx
                ? 'bg-ot-orange text-white'
                : 'bg-ot-dark-blue/50 text-white/50 hover:text-white/70 border border-ot-light-blue/30'
            }`}
          >
            {round.name}
          </button>
        ))}
      </div>

      {/* Match cards */}
      {currentRound ? (
        currentRound.matches.length > 0 ? (
          <div className="grid gap-3">
            {currentRound.matches.map((match) => {
              const isFinalizado = match.status === 'finalizado'
              const homeWins =
                isFinalizado &&
                match.homeTeam.score !== null &&
                match.awayTeam.score !== null &&
                match.homeTeam.score > match.awayTeam.score
              const awayWins =
                isFinalizado &&
                match.homeTeam.score !== null &&
                match.awayTeam.score !== null &&
                match.awayTeam.score > match.homeTeam.score

              return (
                <div
                  key={match.id}
                  className="rounded-xl border border-ot-light-blue/50 bg-ot-dark-blue/30 p-4"
                >
                  {/* Teams and scores */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 text-right">
                      <span
                        className={`font-din-display font-semibold text-sm ${
                          homeWins ? 'text-white' : 'text-white/70'
                        }`}
                      >
                        {match.homeTeam.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isFinalizado ? (
                        <>
                          <span
                            className={`font-946-latin text-2xl ${
                              homeWins ? 'text-ot-orange' : 'text-white/70'
                            }`}
                          >
                            {match.homeTeam.score}
                          </span>
                          <span className="text-white/30 text-sm">-</span>
                          <span
                            className={`font-946-latin text-2xl ${
                              awayWins ? 'text-ot-orange' : 'text-white/70'
                            }`}
                          >
                            {match.awayTeam.score}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="text-white/30 text-lg">-</span>
                          <span className="text-white/30 text-sm">vs</span>
                          <span className="text-white/30 text-lg">-</span>
                        </>
                      )}
                    </div>

                    <div className="flex-1 text-left">
                      <span
                        className={`font-din-display font-semibold text-sm ${
                          awayWins ? 'text-white' : 'text-white/70'
                        }`}
                      >
                        {match.awayTeam.name}
                      </span>
                    </div>
                  </div>

                  {/* Meta info */}
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/40">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {match.venue}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {match.time}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(currentRound.date)}
                    </span>
                    <span
                      className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                        isFinalizado
                          ? 'bg-green-500/15 text-green-400'
                          : 'bg-blue-500/15 text-blue-400'
                      }`}
                    >
                      {isFinalizado ? 'Finalizado' : 'Programado'}
                    </span>
                  </div>
                </div>
              )
            })}
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
