'use client'

import { useMemo, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Loader2, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { upsertMatchPlayerStatsAction } from '@/modules/admin/actions/matchStatsActions'
import { getErrorMessage } from '@/modules/common/errors'
import type { MatchPlayerStatRow } from '@/modules/match/PlayerStatsService'

interface RosterMember {
  profileId: string
  name: string
  avatarUrl: string | null
}

interface TeamForStats {
  id: string
  name: string
  members: RosterMember[]
}

interface MatchStatsSectionProps {
  matchId: string
  homeTeam: TeamForStats | null
  awayTeam: TeamForStats | null
  initialStats: MatchPlayerStatRow[]
}

type StatField =
  | 'pt1'
  | 'pt1Att'
  | 'pt2'
  | 'pt2Att'
  | 'pt3'
  | 'pt3Att'
  | 'fouls'
  | 'steals'
  | 'rebounds'
  | 'assists'
  | 'turnovers'
  | 'blocks'

const STAT_COLUMNS: { key: StatField; label: string; title: string }[] = [
  { key: 'pt1', label: 'TL', title: 'Tiros libres convertidos' },
  { key: 'pt2', label: '2P', title: 'Dobles convertidos' },
  { key: 'pt3', label: '3P', title: 'Triples convertidos' },
  { key: 'fouls', label: 'FAL', title: 'Faltas' },
  { key: 'steals', label: 'ROB', title: 'Robos' },
  { key: 'rebounds', label: 'REB', title: 'Rebotes' },
  { key: 'assists', label: 'AS', title: 'Asistencias' },
]

type Row = Record<StatField, number>

const emptyRow = (): Row => ({
  pt1: 0,
  pt1Att: 0,
  pt2: 0,
  pt2Att: 0,
  pt3: 0,
  pt3Att: 0,
  fouls: 0,
  steals: 0,
  rebounds: 0,
  assists: 0,
  turnovers: 0,
  blocks: 0,
})

function rowFromStats(s: MatchPlayerStatRow): Row {
  return {
    pt1: s.pt1,
    pt1Att: s.pt1Att,
    pt2: s.pt2,
    pt2Att: s.pt2Att,
    pt3: s.pt3,
    pt3Att: s.pt3Att,
    fouls: s.fouls,
    steals: s.steals,
    rebounds: s.rebounds,
    assists: s.assists,
    turnovers: s.turnovers,
    blocks: s.blocks,
  }
}

function computePoints(row: Row): number {
  return row.pt1 + 2 * row.pt2 + 3 * row.pt3
}

interface TeamGridProps {
  team: TeamForStats
  rowsByProfile: Record<string, Row>
  onChange: (profileId: string, field: StatField, value: number) => void
}

function TeamGrid({ team, rowsByProfile, onChange }: TeamGridProps) {
  if (team.members.length === 0) {
    return (
      <div className="rounded-xl bg-white p-6 text-[13px] text-[#9b99a6] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        El equipo {team.name} no tiene jugadores activos.
      </div>
    )
  }

  return (
    <div className="rounded-xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
      <div className="border-b border-[#f0efe9] px-4 py-3 flex items-center justify-between">
        <h3 className="text-[13px] font-semibold text-[#0f0e13]">{team.name}</h3>
        <span className="text-[11px] uppercase tracking-[0.08em] text-[#9b99a6]">
          {team.members.length} jugador{team.members.length === 1 ? '' : 'es'}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="bg-[#fafaf8] text-[10px] uppercase tracking-[0.06em] text-[#9b99a6]">
              <th className="text-left font-semibold px-4 py-2 min-w-44">Jugador</th>
              {STAT_COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className="font-semibold px-2 py-2 text-center"
                  title={col.title}
                >
                  {col.label}
                </th>
              ))}
              <th className="font-semibold px-2 py-2 text-center text-[#0f0e13]">PTS</th>
            </tr>
          </thead>
          <tbody>
            {team.members.map((member) => {
              const row = rowsByProfile[member.profileId] ?? emptyRow()
              const pts = computePoints(row)
              return (
                <tr
                  key={member.profileId}
                  className="border-t border-[#f0efe9]"
                >
                  <td className="px-4 py-2 text-[#0f0e13]">{member.name}</td>
                  {STAT_COLUMNS.map((col) => (
                    <td key={col.key} className="px-1 py-1.5 text-center">
                      <Input
                        type="number"
                        min={0}
                        value={row[col.key]}
                        onChange={(e) =>
                          onChange(
                            member.profileId,
                            col.key,
                            Math.max(0, Number(e.target.value) || 0),
                          )
                        }
                        className="h-8 w-14 mx-auto text-center text-[12px] border-[#e8e6e1]"
                      />
                    </td>
                  ))}
                  <td className="px-2 py-2 text-center font-semibold text-[#0f0e13]">
                    {pts}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function MatchStatsSection({
  matchId,
  homeTeam,
  awayTeam,
  initialStats,
}: MatchStatsSectionProps) {
  // Estado: rows[profileId] -> Row con teamId implícito (lo tomamos del team al guardar).
  const initialRows = useMemo(() => {
    const map: Record<string, Row> = {}
    for (const s of initialStats) {
      map[s.profileId] = rowFromStats(s)
    }
    return map
  }, [initialStats])

  const [rows, setRows] = useState<Record<string, Row>>(initialRows)
  const [pending, startTransition] = useTransition()

  const handleChange = (profileId: string, field: StatField, value: number) => {
    setRows((prev) => ({
      ...prev,
      [profileId]: {
        ...(prev[profileId] ?? emptyRow()),
        [field]: value,
      },
    }))
  }

  const handleSave = () => {
    if (!homeTeam && !awayTeam) {
      toast.error('No hay teams en este partido para cargar stats.')
      return
    }

    const stats: Array<{ profileId: string; teamId: string } & Row> = []
    for (const team of [homeTeam, awayTeam].filter(Boolean) as TeamForStats[]) {
      for (const m of team.members) {
        const row = rows[m.profileId]
        if (!row) continue
        // Solo enviamos jugadores con al menos un valor distinto de 0 (evitamos
        // crear filas vacías). El BE permite reset enviando todos en 0.
        const hasAny = Object.values(row).some((v) => v > 0)
        if (!hasAny) continue
        stats.push({ profileId: m.profileId, teamId: team.id, ...row })
      }
    }

    if (stats.length === 0) {
      toast.error('Cargá al menos una stat antes de guardar.')
      return
    }

    startTransition(async () => {
      const result = await upsertMatchPlayerStatsAction({ matchId, stats })
      if (result.success) {
        toast.success('Stats guardadas')
      } else {
        toast.error(getErrorMessage(result.error))
      }
    })
  }

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-[13px] font-semibold text-[#0f0e13]">
            Stats individuales
          </h2>
          <p className="mt-0.5 text-[12px] text-[#9b99a6]">
            Carga manual por jugador (BE-MOCK-005). PTS se computa
            automáticamente como TL + 2·2P + 3·3P.
          </p>
        </div>
        <Button
          type="button"
          onClick={handleSave}
          disabled={pending}
          className="bg-[#ff3b2f] hover:bg-[#e5352a] text-white"
        >
          {pending ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <Save className="mr-2 size-4" />
          )}
          Guardar stats
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {homeTeam && (
          <TeamGrid
            team={homeTeam}
            rowsByProfile={rows}
            onChange={handleChange}
          />
        )}
        {awayTeam && (
          <TeamGrid
            team={awayTeam}
            rowsByProfile={rows}
            onChange={handleChange}
          />
        )}
      </div>
    </section>
  )
}
