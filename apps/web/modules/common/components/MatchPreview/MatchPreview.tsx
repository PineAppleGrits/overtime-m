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
    hasScore && match.tournamentId && match.categoryId
      ? `/torneos/${match.tournamentId}/categoria/${match.categoryId}/partidos/${match.id}`
      : undefined

  return (
    <div
      style={{
        overflow: 'hidden',
        position: 'relative',
        minWidth: '450px',
        width: '450px',
        filter: 'drop-shadow(0px 0px 7px rgba(0,0,0,0.4))',
        cursor: 'default',
      }}
    >
      {/* ── HEAD (trapezoid) ── */}
      <div
        style={{
          position: 'relative',
          width: '95%',
          margin: 'auto',
          color: '#a9a5bb',
          borderRight: '20px solid transparent',
          borderLeft: '20px solid transparent',
          borderBottom: '34px solid #2a2548',
        }}
      >
        {/* Purple triangle accent behind match type */}
        <div
          style={{
            zIndex: 1,
            width: '137px',
            left: '125px',
            top: '18px',
            position: 'absolute',
            borderRight: '22px solid transparent',
            borderLeft: '22px solid transparent',
            borderBottom: '36px solid #3b336a',
          }}
        />

        {/* Head data row */}
        <div
          style={{
            zIndex: 2,
            height: '20px',
            width: '100%',
            top: '27px',
            position: 'relative',
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-evenly',
            alignItems: 'center',
          }}
        >
          <div style={{ width: '33%', textAlign: 'center', overflow: 'hidden' }}>
            <p className="font-din-display text-[13px] text-[#a9a5bb]">
              {match.date ? (
                <>{formatDate(match.date)} <strong>{formatTime(match.date)}</strong></>
              ) : (
                'A confirmar'
              )}
            </p>
          </div>
          <div style={{ width: '35%', textAlign: 'center' }}>
            <h3 className="font-din-display text-[12px] font-bold uppercase text-[#a9a5bb]">
              {match.matchType}
            </h3>
          </div>
          <div style={{ width: '33%', textAlign: 'center', overflow: 'hidden' }}>
            <p className="font-din-display text-[13px] text-[#a9a5bb] truncate">
              {match.location ?? 'A confirmar'}
            </p>
          </div>
        </div>
      </div>

      {/* ── BODY ── */}
      <div
        style={{
          position: 'relative',
          height: '135px',
          borderRadius: '5px',
          backgroundColor: '#181525',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            padding: '25px 40px 0 40px',
          }}
        >
          {/* Skewed background left */}
          <div
            className="absolute left-0 w-1/2 h-[60px]"
            style={{
              zIndex: 1,
              background: hasScore
                ? 'linear-gradient(270deg, rgba(59,51,106,0.2) 1%, rgba(59,51,106,0) 75%)'
                : 'linear-gradient(270deg, rgba(59,51,106,0.2) 6.78%, rgba(59,51,106,0) 77%), #181525',
              transform: 'skew(150deg, 0deg)',
            }}
          />
          {/* Skewed background right */}
          <div
            className="absolute right-0 w-1/2 h-[60px]"
            style={{
              zIndex: 1,
              background: hasScore
                ? 'linear-gradient(90deg, #3B336A 19.94%, rgba(59,51,106,0) 80%)'
                : 'linear-gradient(90deg, rgba(59,51,106,0.4) 6%, rgba(59,51,106,0) 75%)',
              transform: 'skew(-30deg, 0deg)',
            }}
          />

          {/* Team 1 badge */}
          <div style={{ zIndex: 2, maxWidth: '120px' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={match.team1.logoUrl ?? DEFAULT_BADGE}
              alt={match.team1.name}
              style={{ objectFit: 'contain', width: '60px', height: '60px' }}
            />
          </div>

          {/* Score */}
          <div
            style={{
              zIndex: 2,
              width: '65%',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              textAlign: 'center',
              fontSize: '35px',
              fontWeight: 700,
              paddingTop: '3px',
            }}
            className="font-din-display"
          >
            <div style={{ width: '50%', color: hasScore ? '#fff' : '#4e4585' }}>
              {match.team1Score ?? '-'}
            </div>
            <div style={{ width: '50%', color: hasScore ? '#ff3b2f' : '#4e4585' }}>
              {match.team2Score ?? '-'}
            </div>
          </div>

          {/* Team 2 badge */}
          <div style={{ zIndex: 2, maxWidth: '120px' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={match.team2.logoUrl ?? DEFAULT_BADGE}
              alt={match.team2.name}
              style={{ objectFit: 'contain', width: '60px', height: '60px' }}
            />
          </div>
        </div>

        {/* Team names */}
        <div
          style={{
            marginTop: '12px',
            padding: '0 23px',
            color: '#f1f1f1',
            display: 'flex',
            width: '100%',
            justifyContent: 'space-between',
            fontSize: '14px',
            fontWeight: 100,
            lineHeight: '1em',
            textAlign: 'center',
            textTransform: 'uppercase',
          }}
          className="font-din-display"
        >
          <div style={{ width: '93px', display: 'flex', justifyContent: 'center' }}>
            {match.team1.name}
          </div>
          <div style={{ width: '93px', display: 'flex', justifyContent: 'center' }}>
            {match.team2.name}
          </div>
        </div>
      </div>

      {/* ── FOOTER ── */}
      {hasScore ?
        (
          <Link
            href={statsHref ?? "#"}
            className="inline-block rounded-sm relative px-4 py-2 left-1/2 border-none text-md text-black -translate-x-1/2 -translate-y-1/2 mx-auto cursor-pointer uppercase font-bold hover:bg-ot-red/80 transition-colors duration-200 bg-ot-orange"
          >
            Ver estadísticas
          </Link>
        ) : (
          <div
            style={{
              textTransform: 'uppercase',
              fontWeight: 'bold',
              fontSize: '12px',
              color: '#4e4585',
              position: 'relative',
              bottom: '16%',
              left: '41%',
            }}
            className="font-din-display"
          >
            pendiente
          </div>
        )}
    </div>
  )
}
