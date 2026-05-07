import Link from 'next/link'
import { matchTypeLabel } from './matchTypeLabel'
import type { MatchPreviewData } from './types'

interface Props {
  match: MatchPreviewData
}

const DEFAULT_BADGE = '/overtime_logo.png'
const ARG_TZ = 'America/Argentina/Buenos_Aires'

/**
 * Formato determinístico (server === client) — evitamos toLocaleString
 * porque el separador entre hora y AM/PM varía entre Node ICU y el browser
 * (regular space vs   NBSP), lo que rompe la hidratación.
 */
function getDateParts(dateStr: string) {
  const d = new Date(dateStr)
  const parts = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: ARG_TZ,
  }).formatToParts(d)
  const get = (t: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === t)?.value ?? ''
  return {
    day: get('day'),
    month: get('month'),
    year: get('year'),
    hour24: parseInt(get('hour'), 10),
    minute: get('minute'),
  }
}

function formatDate(dateStr: string) {
  const { day, month, year } = getDateParts(dateStr)
  return `${day}/${month}/${year}`
}

function formatTime(dateStr: string) {
  const { hour24, minute } = getDateParts(dateStr)
  const period = hour24 >= 12 ? 'p. m.' : 'a. m.'
  const h12 = hour24 % 12 === 0 ? 12 : hour24 % 12
  return `${String(h12).padStart(2, '0')}:${minute} ${period}`
}

export function MatchPreview({ match }: Props) {
  const hasScore = match.team1Score !== undefined && match.team2Score !== undefined
  const statsHref =
    hasScore && match.tournamentSlug && match.categorySlug
      ? `/torneos/${match.tournamentSlug}/${match.categorySlug}/partido/${match.id}`
      : undefined

  return (
    <div className="overflow-hidden relative w-full max-w-[450px] min-w-0 filter-[drop-shadow(0px_0px_7px_rgba(0,0,0,0.4))] cursor-default">

      {/* ── HEAD (trapezoid) ── */}
      <div className="relative w-[95%] mx-auto text-[#a9a5bb] [border-right:20px_solid_transparent] [border-left:20px_solid_transparent] [border-bottom:34px_solid_#2a2548]">

        {/* Purple triangle accent behind match type */}
        <div className="absolute z-1 left-1/2 -translate-x-1/2 w-[35%] max-w-34.25 top-4.5 [border-right:22px_solid_transparent] [border-left:22px_solid_transparent] [border-bottom:36px_solid_#3b336a]" />

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
              {matchTypeLabel(match.matchType)}
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
        <div className="flex flex-row justify-between items-center gap-2 pt-6.25 px-4 sm:px-10">

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
          <div className="z-2 shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={match.team1.logoUrl ?? DEFAULT_BADGE}
              alt={match.team1.name}
              className="object-contain w-12 h-12 sm:w-15 sm:h-15"
            />
          </div>

          {/* Score */}
          <div className="z-2 flex-1 min-w-0 flex justify-around items-center text-center text-[34px] sm:text-[35px] font-bold font-946-latin">
            <div className={`flex-1 ${hasScore ? 'text-white' : 'text-[#4e4585]'}`}>
              {match.team1Score ?? '-'}
            </div>
            <div className={`flex-1 ${hasScore ? 'text-ot-orange' : 'text-[#4e4585]'}`}>
              {match.team2Score ?? '-'}
            </div>
          </div>

          {/* Team 2 badge */}
          <div className="z-2 shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={match.team2.logoUrl ?? DEFAULT_BADGE}
              alt={match.team2.name}
              className="object-contain w-12 h-12 sm:w-15 sm:h-15"
            />
          </div>
        </div>

        {/* Team names */}
        <div className="mt-3 px-3 sm:px-5.75 text-[#f1f1f1] flex w-full justify-between gap-2 text-[14px] font-thin leading-[1em] text-center uppercase font-din-display">
          <div className="flex-1 min-w-0 flex justify-center truncate">{match.team1.name}</div>
          <div className="flex-1 min-w-0 flex justify-center truncate">{match.team2.name}</div>
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
