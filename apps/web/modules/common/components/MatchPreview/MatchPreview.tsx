import Link from 'next/link'
import type { MatchPreviewData } from './types'

interface Props {
  match: MatchPreviewData
}

const DEFAULT_BADGE = '/overtime_logo.png'

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
}

export function MatchPreview({ match }: Props) {
  const hasScore = match.team1Score !== undefined && match.team2Score !== undefined
  const statsHref =
    hasScore && match.tournamentSlug && match.categorySlug
      ? `/torneos/${match.tournamentSlug}/${match.categorySlug}/partido/${match.id}`
      : undefined

  return (
    <div className="overflow-hidden relative min-w-88.75 w-112.5 filter-[drop-shadow(0px_0px_7px_rgba(0,0,0,0.4))] cursor-default">

      {/* ── HEAD (trapezoid) ── */}
      <div className="relative w-[95%] mx-auto text-[#a9a5bb] [border-right:20px_solid_transparent] [border-left:20px_solid_transparent] [border-bottom:34px_solid_#2a2548]">

        {/* Purple triangle accent behind match type */}
        <div className="absolute z-1 w-34.25 left-31.25 top-4.5 [border-right:22px_solid_transparent] [border-left:22px_solid_transparent] [border-bottom:36px_solid_#3b336a]" />

        {/* Head data row */}
        <div className="relative z-2 h-5 w-full top-6.75 flex flex-row justify-evenly items-center">
          <div className="w-[33%] text-center overflow-hidden">
            <p className="font-din-display text-[13px] text-[#a9a5bb]">
              {match.date ? (
                <>{formatDate(match.date)} <strong>{formatTime(match.date)}</strong></>
              ) : (
                'A confirmar'
              )}
            </p>
          </div>
          <div className="w-[35%] text-center">
            <h3 className="font-din-display text-[12px] font-bold uppercase text-[#a9a5bb]">
              {match.matchType}
            </h3>
          </div>
          <div className="w-[33%] text-center overflow-hidden">
            <p className="font-din-display text-[13px] text-[#a9a5bb] truncate">
              {match.location ?? 'A confirmar'}
            </p>
          </div>
        </div>
      </div>

      {/* ── BODY ── */}
      <div className="relative h-33.75 rounded-[5px] bg-[#181525]">
        <div className="flex flex-row justify-between pt-6.25 px-10">

          {/* Skewed background left */}
          <div
            className="absolute left-0 w-1/2 h-15 z-1 transform-[skew(150deg,0deg)]"
            style={{
              background: hasScore
                ? 'linear-gradient(270deg, rgba(59,51,106,0.2) 1%, rgba(59,51,106,0) 75%)'
                : 'linear-gradient(270deg, rgba(59,51,106,0.2) 6.78%, rgba(59,51,106,0) 77%), #181525',
            }}
          />
          {/* Skewed background right */}
          <div
            className="absolute right-0 w-1/2 h-15 z-1 transform-[skew(-30deg,0deg)]"
            style={{
              background: hasScore
                ? 'linear-gradient(90deg, #3B336A 19.94%, rgba(59,51,106,0) 80%)'
                : 'linear-gradient(90deg, rgba(59,51,106,0.4) 6%, rgba(59,51,106,0) 75%)',
            }}
          />

          {/* Team 1 badge */}
          <div className="z-2 max-w-30">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={match.team1.logoUrl ?? DEFAULT_BADGE}
              alt={match.team1.name}
              className="object-contain w-15 h-15"
            />
          </div>

          {/* Score */}
          <div className="z-2 w-85 flex justify-between items-center text-center text-[35px] font-bold font-946-latin">
            <div className={`w-1/2 ${hasScore ? 'text-white' : 'text-[#4e4585]'}`}>
              {match.team1Score ?? '-'}
            </div>
            <div className={`w-1/2 ${hasScore ? 'text-ot-orange' : 'text-[#4e4585]'}`}>
              {match.team2Score ?? '-'}
            </div>
          </div>

          {/* Team 2 badge */}
          <div className="z-2 max-w-30">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={match.team2.logoUrl ?? DEFAULT_BADGE}
              alt={match.team2.name}
              className="object-contain w-15 h-15"
            />
          </div>
        </div>

        {/* Team names */}
        <div className="mt-3 px-5.75 text-[#f1f1f1] flex w-full justify-between text-[14px] font-thin leading-[1em] text-center uppercase font-din-display">
          <div className="w-23.25 flex justify-center">{match.team1.name}</div>
          <div className="w-23.25 flex justify-center">{match.team2.name}</div>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <div className="relative flex items-center justify-center h-10 -translate-y-full">
        {hasScore ? (
          <Link
            href={statsHref ?? '#'}
            className="inline-block rounded-sm relative px-4 py-2 border-none text-md text-black translate-y-1/2 cursor-pointer uppercase font-bold hover:bg-ot-orange/80 transition-colors duration-200 bg-ot-orange font-din-display"
          >
            Ver estadísticas
          </Link>
        ) : (
          <div className="uppercase inline-block font-bold text-sm text-[#4e4585] relative font-din-display">
            pendiente
          </div>
        )}
      </div>
    </div>
  )
}
