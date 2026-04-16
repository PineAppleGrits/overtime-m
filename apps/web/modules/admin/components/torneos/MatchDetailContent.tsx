'use client'

import { PageHeader } from '@/modules/admin/components/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Calendar, MapPin, Clock, Trophy, Users, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

// ─── Types ──────────────────────────────────────────────────────────────────

interface PlayerStats {
  id: string
  name: string
  jerseyNumber: number
  isCaptain: boolean
  isMvp: boolean
  points: number
  freeThrows: number   // TL (1pt)
  twoPointers: number  // TC 2P (2pts)
  threePointers: number // TC 3P (3pts)
  fouls: number
  steals: number
  rebounds: number
  assists: number
}

interface TeamData {
  id: string
  name: string
  logoUrl: string | null
  players: PlayerStats[]
}

interface MatchData {
  id: string
  status: string
  matchType: string
  matchDate: string
  matchTime: string | null
  homeScore: number
  awayScore: number
  homeTeam: TeamData
  awayTeam: TeamData
  venue: { name: string; address?: string } | null
  category: { name: string; tournament: { name: string; slug: string }; slug: string } | null
  videoUrl?: string | null
  driveFolder?: string | null
}

// ─── Mock Data ──────────────────────────────────────────────────────────────

const MOCK_MATCH: MatchData = {
  id: 'match-001',
  status: 'finalizado',
  matchType: 'regular',
  matchDate: '2025-11-15T21:00:00.000Z',
  matchTime: '21:00',
  homeScore: 78,
  awayScore: 71,
  homeTeam: {
    id: 'team-1',
    name: 'Los Tigres',
    logoUrl: null,
    // Points check: 24+20+14+13+7 = 78 ✓
    players: [
      { id: 'p1', name: 'Lucas Pérez', jerseyNumber: 7, isCaptain: true, isMvp: true, points: 24, freeThrows: 2, twoPointers: 8, threePointers: 2, fouls: 3, steals: 4, rebounds: 7, assists: 5 },
      { id: 'p2', name: 'Marcos Díaz', jerseyNumber: 11, isCaptain: false, isMvp: false, points: 20, freeThrows: 4, twoPointers: 5, threePointers: 2, fouls: 2, steals: 1, rebounds: 3, assists: 6 },
      { id: 'p3', name: 'Nicolás García', jerseyNumber: 23, isCaptain: false, isMvp: false, points: 14, freeThrows: 1, twoPointers: 5, threePointers: 1, fouls: 4, steals: 2, rebounds: 8, assists: 1 },
      { id: 'p4', name: 'Rodrigo Sosa', jerseyNumber: 4, isCaptain: false, isMvp: false, points: 13, freeThrows: 2, twoPointers: 4, threePointers: 1, fouls: 1, steals: 3, rebounds: 5, assists: 2 },
      { id: 'p5', name: 'Fabio Torres', jerseyNumber: 15, isCaptain: false, isMvp: false, points: 7, freeThrows: 1, twoPointers: 2, threePointers: 1, fouls: 2, steals: 0, rebounds: 2, assists: 4 },
    ],
  },
  awayTeam: {
    id: 'team-2',
    name: 'Panthers',
    logoUrl: null,
    // Points check: 22+16+14+11+8 = 71 ✓
    players: [
      { id: 'p6', name: 'Ezequiel Romero', jerseyNumber: 10, isCaptain: true, isMvp: false, points: 22, freeThrows: 2, twoPointers: 7, threePointers: 2, fouls: 3, steals: 2, rebounds: 6, assists: 3 },
      { id: 'p7', name: 'Iván Martínez', jerseyNumber: 5, isCaptain: false, isMvp: false, points: 16, freeThrows: 2, twoPointers: 4, threePointers: 2, fouls: 5, steals: 1, rebounds: 4, assists: 7 },
      { id: 'p8', name: 'Bruno López', jerseyNumber: 33, isCaptain: false, isMvp: false, points: 14, freeThrows: 1, twoPointers: 5, threePointers: 1, fouls: 2, steals: 3, rebounds: 5, assists: 2 },
      { id: 'p9', name: 'Mateo Fernández', jerseyNumber: 9, isCaptain: false, isMvp: false, points: 11, freeThrows: 0, twoPointers: 4, threePointers: 1, fouls: 3, steals: 1, rebounds: 3, assists: 1 },
      { id: 'p10', name: 'Agustín Ruiz', jerseyNumber: 21, isCaptain: false, isMvp: false, points: 8, freeThrows: 2, twoPointers: 3, threePointers: 0, fouls: 1, steals: 2, rebounds: 2, assists: 0 },
    ],
  },
  venue: { name: 'Polideportivo Sur', address: 'Av. Directorio 4300' },
  category: { name: 'Categoría A', tournament: { name: 'Liga Overtime 2025', slug: 'liga-overtime-2025' }, slug: 'categoria-a' },
  videoUrl: 'https://youtube.com',
  driveFolder: null,
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  programado: { label: 'Programado', variant: 'secondary' },
  en_curso: { label: 'En curso', variant: 'default' },
  finalizado: { label: 'Finalizado', variant: 'outline' },
  suspendido: { label: 'Suspendido', variant: 'destructive' },
  cancelado: { label: 'Cancelado', variant: 'destructive' },
  reprogramado: { label: 'Reprogramado', variant: 'secondary' },
}

const STAT_COLUMNS: { key: keyof Pick<PlayerStats, 'points' | 'freeThrows' | 'twoPointers' | 'threePointers' | 'fouls' | 'steals' | 'rebounds' | 'assists'>; label: string; highlight?: boolean }[] = [
  { key: 'points', label: 'PTS', highlight: true },
  { key: 'freeThrows', label: 'TL' },
  { key: 'twoPointers', label: '2P' },
  { key: 'threePointers', label: '3P' },
  { key: 'fouls', label: 'FAL' },
  { key: 'steals', label: 'ROB' },
  { key: 'rebounds', label: 'REB' },
  { key: 'assists', label: 'AS' },
]

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function sumTeamPoints(players: PlayerStats[]) {
  return players.reduce((sum, p) => sum + p.points, 0)
}

// ─── Team Stats Table ───────────────────────────────────────────────────────

function TeamStatsTable({ team, isHome }: { team: TeamData; isHome: boolean }) {
  const totalPoints = sumTeamPoints(team.players)
  const accentColor = isHome ? 'text-[#ff3b2f]' : 'text-[#6b6a72]'
  const accentBg = isHome ? 'bg-[#ff3b2f]' : 'bg-[#6b6a72]'

  return (
    <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
      {/* Team header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#f0efe9]">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full ${accentBg} flex items-center justify-center`}>
            <Users className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-[#0f0e13]">{team.name}</h3>
            <span className="text-[11px] text-[#9b99a6]">
              {isHome ? 'Local' : 'Visitante'} · {team.players.length} jugadores
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-3xl font-bold ${accentColor}`}>{totalPoints}</div>
          <span className="text-[11px] text-[#9b99a6]">puntos</span>
        </div>
      </div>

      {/* Stats table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#f0efe9]">
              <th className="text-left px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9b99a6] w-10">#</th>
              <th className="text-left py-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9b99a6]">Jugador</th>
              {STAT_COLUMNS.map(col => (
                <th
                  key={col.key}
                  className={`text-center px-2 py-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] ${
                    col.highlight ? accentColor : 'text-[#9b99a6]'
                  }`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {team.players.map((player) => (
              <tr
                key={player.id}
                className="border-b border-[#f0efe9] last:border-b-0 hover:bg-[#fafaf8] transition-colors"
              >
                <td className="px-5 py-3 text-[#9b99a6] font-medium">{player.jerseyNumber}</td>
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-[#0f0e13]">{player.name}</span>
                    {player.isCaptain && (
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded border border-[#e8e6e1] text-[10px] font-bold text-[#6b6a72]">
                        C
                      </span>
                    )}
                    {player.isMvp && (
                      <span className="inline-flex items-center justify-center px-1.5 h-5 rounded bg-amber-50 border border-amber-200 text-[10px] font-bold text-amber-600">
                        MVP
                      </span>
                    )}
                  </div>
                </td>
                {STAT_COLUMNS.map(col => (
                  <td
                    key={col.key}
                    className={`text-center px-2 py-3 tabular-nums ${
                      col.highlight ? `font-bold ${accentColor}` : 'text-[#6b6a72]'
                    }`}
                  >
                    {player[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          {/* Totals row */}
          <tfoot>
            <tr className="bg-[#fafaf8] border-t border-[#e8e6e1]">
              <td className="px-5 py-2.5" />
              <td className="py-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9b99a6]">Total</td>
              {STAT_COLUMNS.map(col => (
                <td
                  key={col.key}
                  className={`text-center px-2 py-2.5 font-bold tabular-nums ${
                    col.highlight ? accentColor : 'text-[#6b6a72]'
                  }`}
                >
                  {team.players.reduce((sum, p) => sum + p[col.key], 0)}
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────

interface MatchDetailContentProps {
  tournamentId: string
  matchId: string
}

export function MatchDetailContent({ tournamentId }: MatchDetailContentProps) {
  // TODO: conectar con API — usar matchId para fetch
  const match = MOCK_MATCH
  const statusInfo = STATUS_MAP[match.status] ?? { label: match.status, variant: 'secondary' as const }

  const publicMatchUrl =
    match.category
      ? `/torneos/${match.category.tournament.slug}/${match.category.slug}/partido/${match.id}`
      : null

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${match.homeTeam.name} vs ${match.awayTeam.name}`}
        description={match.category ? `${match.category.tournament.name} · ${match.category.name}` : undefined}
        backHref={`/admin/torneos/${tournamentId}/partidos`}
        actions={
          <div className="flex items-center gap-2">
            {publicMatchUrl && (
              <Button variant="outline" size="sm" asChild>
                <Link href={publicMatchUrl} target="_blank">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Ver página pública
                </Link>
              </Button>
            )}
          </div>
        }
      />

      {/* Match info card */}
      <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* Home team */}
          <div className="flex-1 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-[#f7f6f4] flex items-center justify-center mb-2">
              {match.homeTeam.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={match.homeTeam.logoUrl} alt={match.homeTeam.name} className="w-12 h-12 object-contain" />
              ) : (
                <span className="text-lg font-bold text-[#9b99a6]">
                  {match.homeTeam.name.slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>
            <p className="font-semibold text-[#0f0e13]">{match.homeTeam.name}</p>
            <span className="text-[11px] text-[#9b99a6]">Local</span>
          </div>

          {/* Score */}
          <div className="text-center">
            <div className="flex items-center gap-3">
              <span className="text-4xl font-bold text-[#ff3b2f] tabular-nums">{match.homeScore}</span>
              <span className="text-xl text-[#c4c2cc]">–</span>
              <span className="text-4xl font-bold text-[#0f0e13] tabular-nums">{match.awayScore}</span>
            </div>
            <Badge variant={statusInfo.variant} className="mt-2">
              {statusInfo.label}
            </Badge>
          </div>

          {/* Away team */}
          <div className="flex-1 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-[#f7f6f4] flex items-center justify-center mb-2">
              {match.awayTeam.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={match.awayTeam.logoUrl} alt={match.awayTeam.name} className="w-12 h-12 object-contain" />
              ) : (
                <span className="text-lg font-bold text-[#9b99a6]">
                  {match.awayTeam.name.slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>
            <p className="font-semibold text-[#0f0e13]">{match.awayTeam.name}</p>
            <span className="text-[11px] text-[#9b99a6]">Visitante</span>
          </div>
        </div>

        {/* Meta info */}
        <div className="mt-5 pt-4 border-t border-[#f0efe9] flex flex-wrap gap-x-6 gap-y-2 text-sm text-[#6b6a72]">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-[#c4c2cc]" />
            <span>{formatDate(match.matchDate)}</span>
          </div>
          {match.matchTime && (
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#c4c2cc]" />
              <span>{match.matchTime} hs</span>
            </div>
          )}
          {match.venue && (
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-[#c4c2cc]" />
              <span>{match.venue.name}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-[#c4c2cc]" />
            <span className="capitalize">{match.matchType}</span>
          </div>
        </div>
      </div>

      {/* Stat legend */}
      <div className="text-[12px] text-[#9b99a6] px-1">
        <span className="font-semibold">PTS</span> Puntos · <span className="font-semibold">TL</span> Tiros Libres (1pt) · <span className="font-semibold">2P</span> Tiro de Campo Doble (2pts) · <span className="font-semibold">3P</span> Tiro de Campo Triple (3pts) · <span className="font-semibold">FAL</span> Faltas · <span className="font-semibold">ROB</span> Robos · <span className="font-semibold">REB</span> Rebotes · <span className="font-semibold">AS</span> Asistencias
      </div>

      {/* Team stats tables */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <TeamStatsTable team={match.homeTeam} isHome={true} />
        <TeamStatsTable team={match.awayTeam} isHome={false} />
      </div>
    </div>
  )
}
